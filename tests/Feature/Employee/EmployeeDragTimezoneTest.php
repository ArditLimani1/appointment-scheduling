<?php

namespace Tests\Feature\Employee;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Business;
use App\Models\BusinessType;
use App\Models\Schedule;
use App\Models\ScheduleBreak;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\BusinessTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeeDragTimezoneTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_can_drag_12_00_to_14_00_on_europe_belgrade_business(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create(['role' => UserRole::Admin]);

        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'TZ Biz',
            'slug' => 'tz-biz',
            'timezone' => 'Europe/Belgrade',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
            'slot_duration' => 30,
        ]);

        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
        ]);

        $service45 = Service::create([
            'business_id' => $business->id,
            'name' => 'Prerje',
            'description' => 'Test',
            'duration' => 45,
            'price' => 28,
            'is_active' => true,
            'sort_order' => 0,
        ]);

        $employee->services()->sync([$service45->id]);

        $monday = '2026-06-08';
        $this->assertSame(0, Carbon::parse($monday)->dayOfWeekIso - 1);

        $schedule = Schedule::create([
            'user_id' => $employee->id,
            'day_of_week' => 0,
            'start_time' => '09:00:00',
            'end_time' => '18:00:00',
            'is_active' => true,
        ]);

        ScheduleBreak::create([
            'schedule_id' => $schedule->id,
            'start_time' => '13:00:00',
            'end_time' => '14:00:00',
        ]);

        $appointment = Appointment::create([
            'business_id' => $business->id,
            'employee_id' => $employee->id,
            'service_id' => $service45->id,
            'client_first_name' => 'A',
            'client_last_name' => 'B',
            'client_phone' => '000',
            'client_email' => null,
            'client_notes' => null,
            'date' => $monday,
            'start_time' => '12:00',
            'end_time' => '12:45',
            'price' => 28,
            'status' => AppointmentStatus::Pending,
        ]);

        $response = $this->actingAs($employee)->put(route('employee.appointments.edit', $appointment), [
            'service_id' => $service45->id,
            'status' => 'pending',
            'date' => $monday,
            'start_time' => '14:00',
        ]);

        $response->assertSessionHasNoErrors();

        $appointment->refresh();
        $this->assertSame('14:00', substr((string) $appointment->start_time, 0, 5));
    }

    public function test_europe_belgrade_drag_does_not_false_overlap_with_pre_break_appointment_that_spans_utc_window(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create(['role' => UserRole::Admin]);

        // Europe/Belgrade is UTC+2 in summer. 14:00 Belgrade = 12:00 UTC. An earlier
        // appointment stored at 12:30–13:00 (Belgrade) and parsed without timezone
        // would appear to overlap 14:00–14:45 (=12:00–12:45 UTC) when compared in UTC.
        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'TZ Biz 3',
            'slug' => 'tz-biz-3',
            'timezone' => 'Europe/Belgrade',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
            'slot_duration' => 30,
        ]);

        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
        ]);

        $service45 = Service::create([
            'business_id' => $business->id,
            'name' => 'Prerje',
            'description' => 'Test',
            'duration' => 45,
            'price' => 28,
            'is_active' => true,
            'sort_order' => 0,
        ]);

        $employee->services()->sync([$service45->id]);

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
            'start_time' => '13:00:00',
            'end_time' => '14:00:00',
        ]);

        $apt = Appointment::create([
            'business_id' => $business->id,
            'employee_id' => $employee->id,
            'service_id' => $service45->id,
            'client_first_name' => 'A',
            'client_last_name' => 'B',
            'client_phone' => '000',
            'date' => $monday,
            'start_time' => '11:00',
            'end_time' => '11:45',
            'price' => 28,
            'status' => AppointmentStatus::Pending,
        ]);

        // Second "poisoning" appointment whose naive-UTC projection collides with the 14:00 window
        // when the other operand is TZ-aware. Its Belgrade time is 12:15–13:00, which fits before
        // the 13:00 break, so it must NOT overlap a 14:00–14:45 window in real (business) time.
        Appointment::create([
            'business_id' => $business->id,
            'employee_id' => $employee->id,
            'service_id' => $service45->id,
            'client_first_name' => 'C',
            'client_last_name' => 'D',
            'client_phone' => '111',
            'date' => $monday,
            'start_time' => '12:15',
            'end_time' => '13:00',
            'price' => 28,
            'status' => AppointmentStatus::Confirmed,
        ]);

        $response = $this->actingAs($employee)->put(route('employee.appointments.edit', $apt), [
            'service_id' => $service45->id,
            'status' => 'pending',
            'date' => $monday,
            'start_time' => '14:00',
        ]);

        $response->assertSessionHasNoErrors();

        $apt->refresh();
        $this->assertSame('14:00', substr((string) $apt->start_time, 0, 5));
        $this->assertSame('14:45', substr((string) $apt->end_time, 0, 5));
    }

    public function test_employee_drag_does_not_false_trigger_overlap_with_other_same_day_appointment(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create(['role' => UserRole::Admin]);

        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'TZ Biz 2',
            'slug' => 'tz-biz-2',
            'timezone' => 'Europe/Belgrade',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
            'slot_duration' => 30,
        ]);

        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
        ]);

        $service45 = Service::create([
            'business_id' => $business->id,
            'name' => 'Prerje',
            'description' => 'Test',
            'duration' => 45,
            'price' => 28,
            'is_active' => true,
            'sort_order' => 0,
        ]);

        $employee->services()->sync([$service45->id]);

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
            'start_time' => '13:00:00',
            'end_time' => '14:00:00',
        ]);

        // Appointment to drag
        $apt = Appointment::create([
            'business_id' => $business->id,
            'employee_id' => $employee->id,
            'service_id' => $service45->id,
            'client_first_name' => 'A',
            'client_last_name' => 'B',
            'client_phone' => '000',
            'date' => $monday,
            'start_time' => '12:00',
            'end_time' => '12:45',
            'price' => 28,
            'status' => AppointmentStatus::Pending,
        ]);

        // Another existing appointment earlier in the day
        Appointment::create([
            'business_id' => $business->id,
            'employee_id' => $employee->id,
            'service_id' => $service45->id,
            'client_first_name' => 'C',
            'client_last_name' => 'D',
            'client_phone' => '111',
            'date' => $monday,
            'start_time' => '09:00',
            'end_time' => '09:45',
            'price' => 28,
            'status' => AppointmentStatus::Confirmed,
        ]);

        $response = $this->actingAs($employee)->put(route('employee.appointments.edit', $apt), [
            'service_id' => $service45->id,
            'status' => 'pending',
            'date' => $monday,
            'start_time' => '14:00',
        ]);

        $response->assertSessionHasNoErrors();

        $apt->refresh();
        $this->assertSame('14:00', substr((string) $apt->start_time, 0, 5));
    }
}
