<?php

namespace Tests\Feature\Admin;

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

class AdminAppointmentBreakValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_cannot_move_appointment_into_employee_break(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $business = Business::create([
            'owner_id' => $admin->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Break Val Biz',
            'slug' => 'break-val-biz',
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
            'price' => 30,
            'is_active' => true,
            'sort_order' => 0,
        ]);

        $employee->services()->sync([$service->id]);

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
            'price' => 30,
            'status' => AppointmentStatus::Confirmed,
        ]);

        $response = $this->actingAs($admin)->put(route('admin.appointments.edit', $appointment), [
            'client_first_name' => 'A',
            'client_last_name' => 'B',
            'client_phone' => '000',
            'client_email' => null,
            'client_notes' => '',
            'service_id' => $service->id,
            'status' => 'confirmed',
            'employee_id' => $employee->id,
            'date' => $monday,
            'start_time' => '12:15',
        ]);

        $response->assertSessionHasErrors('start_time');
        $appointment->refresh();
        $this->assertSame('10:00', substr((string) $appointment->start_time, 0, 5));
    }
}
