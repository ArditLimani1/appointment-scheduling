<?php

namespace Tests\Feature\Employee;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Business;
use App\Models\BusinessType;
use App\Models\User;
use Database\Seeders\BusinessTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class EmployeeDashboardDateFilterTest extends TestCase
{
    use RefreshDatabase;

    public function test_same_day_date_range_includes_appointments_on_sqlite(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Dash Filter Biz',
            'slug' => 'dash-filter-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
        ]);

        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
        ]);

        $day = '2026-04-09';

        Appointment::create([
            'business_id' => $business->id,
            'employee_id' => $employee->id,
            'service_id' => null,
            'client_first_name' => 'A',
            'client_last_name' => 'B',
            'client_phone' => '000',
            'client_email' => null,
            'client_notes' => null,
            'date' => $day,
            'start_time' => '10:00',
            'end_time' => '11:00',
            'price' => 10,
            'status' => AppointmentStatus::Confirmed,
        ]);

        $response = $this->actingAs($employee)->get(route('employee.dashboard', [
            'date_from' => $day,
            'date_to' => $day,
        ]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Employee/Dashboard')
            ->where('appointments', fn ($list) => count($list) === 1));
    }
}
