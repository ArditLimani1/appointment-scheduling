<?php

namespace Tests\Feature\Employee;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Listeners\SendCustomerAppointmentUpdateEmail;
use App\Mail\CustomerAppointmentUpdateMail;
use App\Models\Appointment;
use App\Models\Business;
use App\Models\BusinessType;
use App\Models\Schedule;
use App\Models\ScheduleBreak;
use App\Models\Service;
use App\Models\User;
use Database\Seeders\BusinessTypeSeeder;
use Illuminate\Events\CallQueuedListener;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class EmployeeAppointmentEditTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_can_update_own_appointment_via_put(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Edit Apt Biz',
            'slug' => 'edit-apt-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
        ]);

        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
        ]);

        $service = Service::create([
            'business_id' => $business->id,
            'name' => 'Haircut',
            'description' => 'Test',
            'duration' => 60,
            'price' => 40,
            'is_active' => true,
            'sort_order' => 0,
        ]);

        $employee->services()->sync([$service->id]);

        $day = '2026-04-10';
        // Friday — working hours must include rescheduled time (getAdminAvailableSlots / schedule rules).
        Schedule::create([
            'user_id' => $employee->id,
            'day_of_week' => 4,
            'start_time' => '09:00:00',
            'end_time' => '18:00:00',
            'is_active' => true,
        ]);

        $appointment = Appointment::create([
            'business_id' => $business->id,
            'employee_id' => $employee->id,
            'service_id' => $service->id,
            'client_first_name' => 'A',
            'client_last_name' => 'B',
            'client_phone' => '000',
            'client_email' => null,
            'client_notes' => null,
            'date' => $day,
            'start_time' => '10:00',
            'end_time' => '11:00',
            'price' => 40,
            'status' => AppointmentStatus::Pending,
        ]);

        $response = $this->actingAs($employee)->put(route('employee.appointments.edit', $appointment), [
            'service_id' => $service->id,
            'status' => 'confirmed',
            'date' => $day,
            'start_time' => '14:00',
        ]);

        $response->assertRedirect();

        $appointment->refresh();

        $this->assertSame('confirmed', $appointment->status->value);
        $this->assertSame('14:00', substr((string) $appointment->start_time, 0, 5));
        $this->assertSame('15:00', substr((string) $appointment->end_time, 0, 5));
    }

    public function test_employee_update_sends_only_one_customer_email(): void
    {
        config(['queue.default' => 'sync']);
        Mail::fake();

        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Notification Biz',
            'slug' => 'notification-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => 'EUR',
            'is_active' => true,
        ]);

        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
        ]);

        $service = Service::create([
            'business_id' => $business->id,
            'name' => 'Haircut',
            'description' => 'Test',
            'duration' => 60,
            'price' => 40,
            'is_active' => true,
            'sort_order' => 0,
        ]);

        $employee->services()->sync([$service->id]);

        $day = '2026-04-10';
        Schedule::create([
            'user_id' => $employee->id,
            'day_of_week' => 4,
            'start_time' => '09:00:00',
            'end_time' => '18:00:00',
            'is_active' => true,
        ]);

        $appointment = Appointment::create([
            'business_id' => $business->id,
            'employee_id' => $employee->id,
            'service_id' => $service->id,
            'client_first_name' => 'A',
            'client_last_name' => 'B',
            'client_phone' => '000',
            'client_email' => 'client@example.com',
            'client_notes' => null,
            'date' => $day,
            'start_time' => '10:00',
            'end_time' => '11:00',
            'price' => 40,
            'status' => AppointmentStatus::Pending,
        ]);

        $response = $this->actingAs($employee)->put(route('employee.appointments.edit', $appointment), [
            'service_id' => $service->id,
            'status' => 'confirmed',
            'date' => $day,
            'start_time' => '14:00',
        ]);

        $response->assertRedirect();

        Mail::assertSent(CustomerAppointmentUpdateMail::class, 1);
        Mail::assertSent(CustomerAppointmentUpdateMail::class, function (CustomerAppointmentUpdateMail $mail) use ($appointment): bool {
            return $mail->appointment->is($appointment)
                && $mail->notificationType === 'confirmed';
        });
    }

    public function test_queued_listener_exposes_five_tries_for_mail_retries(): void
    {
        $job = new CallQueuedListener(
            SendCustomerAppointmentUpdateEmail::class,
            'handle',
            [],
        );

        $job->tries = (new SendCustomerAppointmentUpdateEmail())->tries();

        $this->assertSame(5, $job->tries);
    }

    public function test_employee_can_reschedule_to_end_exactly_when_next_appointment_starts(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Back-to-back Biz',
            'slug' => 'back-to-back-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
        ]);

        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
        ]);

        $haircut = Service::create([
            'business_id' => $business->id,
            'name' => 'Signature Haircut',
            'description' => 'Test',
            'duration' => 45,
            'price' => 40,
            'is_active' => true,
            'sort_order' => 0,
        ]);

        $trim = Service::create([
            'business_id' => $business->id,
            'name' => 'Express Trim',
            'description' => 'Test',
            'duration' => 30,
            'price' => 20,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $employee->services()->sync([$haircut->id, $trim->id]);

        $day = '2026-06-02';
        // Tuesday — full day coverage for slot stepping (45 min service on 30 min business grid).
        Schedule::create([
            'user_id' => $employee->id,
            'day_of_week' => 1,
            'start_time' => '09:00:00',
            'end_time' => '18:00:00',
            'is_active' => true,
        ]);

        $first = Appointment::create([
            'business_id' => $business->id,
            'employee_id' => $employee->id,
            'service_id' => $haircut->id,
            'client_first_name' => 'A',
            'client_last_name' => 'B',
            'client_phone' => '000',
            'client_email' => null,
            'client_notes' => null,
            'date' => $day,
            'start_time' => '10:00',
            'end_time' => '10:45',
            'price' => 40,
            'status' => AppointmentStatus::Confirmed,
        ]);

        Appointment::create([
            'business_id' => $business->id,
            'employee_id' => $employee->id,
            'service_id' => $trim->id,
            'client_first_name' => 'C',
            'client_last_name' => 'D',
            'client_phone' => '111',
            'client_email' => null,
            'client_notes' => null,
            'date' => $day,
            'start_time' => '11:15',
            'end_time' => '11:45',
            'price' => 20,
            'status' => AppointmentStatus::Confirmed,
        ]);

        $response = $this->actingAs($employee)->put(route('employee.appointments.edit', $first), [
            'service_id' => $haircut->id,
            'status' => 'confirmed',
            'date' => $day,
            'start_time' => '10:30',
        ]);

        $response->assertRedirect();

        $first->refresh();

        $this->assertSame('10:30', substr((string) $first->start_time, 0, 5));
        $this->assertSame('11:15', substr((string) $first->end_time, 0, 5));
    }

    public function test_employee_can_move_appointment_into_own_scheduled_break(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Lunch Self Biz',
            'slug' => 'lunch-self-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
            'slot_duration' => 30,
        ]);

        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
        ]);

        $service = Service::create([
            'business_id' => $business->id,
            'name' => 'Cut',
            'description' => 'Test',
            'duration' => 30,
            'price' => 25,
            'is_active' => true,
            'sort_order' => 0,
        ]);

        $employee->services()->sync([$service->id]);

        $monday = '2026-06-08';
        $schedule = Schedule::create([
            'user_id' => $employee->id,
            'day_of_week' => 0,
            'start_time' => '09:00:00',
            'end_time' => '18:00:00',
            'is_active' => true,
        ]);

        ScheduleBreak::create([
            'schedule_id' => $schedule->id,
            'start_time' => '12:00:00',
            'end_time' => '13:00:00',
        ]);

        $appointment = Appointment::create([
            'business_id' => $business->id,
            'employee_id' => $employee->id,
            'service_id' => $service->id,
            'client_first_name' => 'A',
            'client_last_name' => 'B',
            'client_phone' => '000',
            'client_email' => null,
            'client_notes' => null,
            'date' => $monday,
            'start_time' => '10:00',
            'end_time' => '10:30',
            'price' => 25,
            'status' => AppointmentStatus::Confirmed,
        ]);

        $response = $this->actingAs($employee)->put(route('employee.appointments.edit', $appointment), [
            'service_id' => $service->id,
            'status' => 'confirmed',
            'date' => $monday,
            'start_time' => '12:00',
        ]);

        $response->assertRedirect();
        $appointment->refresh();
        $this->assertSame('12:00', substr((string) $appointment->start_time, 0, 5));
        $this->assertSame('12:30', substr((string) $appointment->end_time, 0, 5));
    }
}
