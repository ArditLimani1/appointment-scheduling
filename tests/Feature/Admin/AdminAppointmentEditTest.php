<?php

namespace Tests\Feature\Admin;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Mail\CustomerAppointmentUpdateMail;
use App\Models\Appointment;
use App\Models\Business;
use App\Models\BusinessType;
use App\Models\Schedule;
use App\Models\Service;
use App\Models\User;
use Database\Seeders\BusinessTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AdminAppointmentEditTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_add_email_to_phone_only_appointment_and_send_update_notification(): void
    {
        config(['queue.default' => 'sync']);
        Mail::fake();

        $this->seed(BusinessTypeSeeder::class);

        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $business = Business::create([
            'owner_id' => $admin->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Admin Edit Biz',
            'slug' => 'admin-edit-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => 'EUR',
            'is_active' => true,
            'client_identifier_type' => 'email',
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
            'date' => '2026-04-10',
            'start_time' => '10:00',
            'end_time' => '11:00',
            'price' => 40,
            'status' => AppointmentStatus::Pending,
        ]);

        $response = $this->actingAs($admin)->put(route('admin.appointments.edit', $appointment), [
            'client_first_name' => 'A',
            'client_last_name' => 'B',
            'client_phone' => '000',
            'client_email' => 'client@example.com',
            'client_notes' => 'Updated',
            'service_id' => $service->id,
            'status' => 'confirmed',
            'employee_id' => $employee->id,
            'date' => '2026-04-10',
            'start_time' => '10:00',
        ]);

        $response->assertRedirect();

        $appointment->refresh();

        $this->assertSame('client@example.com', $appointment->client_email);
        $this->assertSame('000', $appointment->client_phone);

        Mail::assertSent(CustomerAppointmentUpdateMail::class, 1);
        Mail::assertSent(CustomerAppointmentUpdateMail::class, function (CustomerAppointmentUpdateMail $mail) use ($appointment): bool {
            return $mail->appointment->is($appointment)
                && $mail->notificationType === 'confirmed';
        });
    }
}
