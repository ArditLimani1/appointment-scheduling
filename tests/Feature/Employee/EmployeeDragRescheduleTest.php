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

/**
 * Reproduces the employee drag-to-reschedule scenario that the user reported:
 * appointment 12:00-12:45 dragged to 14:00 on a day with a 13:00-14:00 lunch break.
 */
class EmployeeDragRescheduleTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_can_drag_own_appointment_into_first_post_break_slot(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create(['role' => UserRole::Admin]);

        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Drag Biz',
            'slug' => 'drag-biz',
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

        $service45 = Service::create([
            'business_id' => $business->id,
            'name' => 'Prerje e flokëve',
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
        $response->assertRedirect();

        $appointment->refresh();
        $this->assertSame('14:00', substr((string) $appointment->start_time, 0, 5));
        $this->assertSame('14:45', substr((string) $appointment->end_time, 0, 5));
    }
}
