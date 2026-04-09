<?php

namespace Tests\Feature\Employee;

use App\Enums\UserRole;
use App\Models\Business;
use App\Models\BusinessType;
use App\Models\User;
use Database\Seeders\BusinessTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class EmployeeAppointmentCalendarTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_can_view_read_only_calendar(): void
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
            ->has('appointments'));
    }
}
