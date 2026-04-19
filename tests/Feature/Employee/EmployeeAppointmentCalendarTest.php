<?php

namespace Tests\Feature\Employee;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Business;
use App\Models\BusinessType;
use App\Models\Service;
use App\Models\User;
use Database\Seeders\BusinessTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class EmployeeAppointmentCalendarTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_can_view_calendar_with_hours_and_edit_support(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Emp Cal Biz',
            'slug' => 'emp-cal-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
        ]);

        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
        ]);

        $response = $this->actingAs($employee)->get(route('employee.appointments.calendar'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Appointments/Calendar')
            ->where('employee_calendar', true)
            ->has('appointments')
            ->has('calendar_hours')
            ->has('calendar_day_breaks')
            ->has('calendar_day_offs')
            ->has('calendar_employee_day_breaks')
            ->has('calendar_employee_day_offs')
            ->where('calendar_hours.start', fn ($v) => is_string($v) && strlen($v) >= 4)
            ->where('calendar_hours.end', fn ($v) => is_string($v) && strlen($v) >= 4));
    }

    public function test_employee_calendar_filters_appointments_by_service_id(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Emp Cal Service Biz',
            'slug' => 'emp-cal-svc-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
        ]);

        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
        ]);

        $serviceA = Service::create([
            'business_id' => $business->id,
            'name' => 'Cut',
            'description' => null,
            'duration' => 30,
            'price' => 20,
            'is_active' => true,
            'is_popular' => false,
            'sort_order' => 0,
        ]);

        $serviceB = Service::create([
            'business_id' => $business->id,
            'name' => 'Colour',
            'description' => null,
            'duration' => 60,
            'price' => 50,
            'is_active' => true,
            'is_popular' => false,
            'sort_order' => 1,
        ]);

        $employee->services()->sync([$serviceA->id, $serviceB->id]);

        $dayInWeek = '2026-04-14';

        Appointment::create([
            'business_id' => $business->id,
            'employee_id' => $employee->id,
            'service_id' => $serviceA->id,
            'client_first_name' => 'A',
            'client_last_name' => 'One',
            'client_phone' => '000',
            'client_email' => null,
            'client_notes' => null,
            'date' => $dayInWeek,
            'start_time' => '10:00',
            'end_time' => '10:30',
            'price' => 20,
            'status' => AppointmentStatus::Confirmed,
        ]);

        Appointment::create([
            'business_id' => $business->id,
            'employee_id' => $employee->id,
            'service_id' => $serviceB->id,
            'client_first_name' => 'B',
            'client_last_name' => 'Two',
            'client_phone' => '001',
            'client_email' => null,
            'client_notes' => null,
            'date' => $dayInWeek,
            'start_time' => '11:00',
            'end_time' => '12:00',
            'price' => 50,
            'status' => AppointmentStatus::Confirmed,
        ]);

        $response = $this->actingAs($employee)->get(route('employee.appointments.calendar', [
            'date' => '2026-04-15',
            'view' => 'week',
            'service_id' => $serviceA->id,
        ]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->where('filters.service_id', (int) $serviceA->id)
            ->where('appointments', fn ($rows) => is_countable($rows) && count($rows) === 1));
    }
}
