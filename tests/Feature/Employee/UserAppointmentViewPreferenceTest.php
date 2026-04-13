<?php

namespace Tests\Feature\Employee;

use App\Enums\UserRole;
use App\Models\Business;
use App\Models\BusinessType;
use App\Models\User;
use App\Models\UserAppointmentViewPreference;
use Database\Seeders\BusinessTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserAppointmentViewPreferenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_with_calendar_preference_is_redirected_from_index_to_calendar(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Pref Biz',
            'slug' => 'pref-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
        ]);

        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
        ]);

        UserAppointmentViewPreference::create([
            'user_id' => $employee->id,
            'is_calendar_default' => true,
        ]);

        $response = $this->actingAs($employee)->get(route('employee.appointments.index'));

        $response->assertRedirect(route('employee.appointments.calendar'));
    }

    public function test_list_query_parameter_allows_table_view_when_calendar_is_preferred(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Pref Biz 2',
            'slug' => 'pref-biz-2',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
        ]);

        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
        ]);

        UserAppointmentViewPreference::create([
            'user_id' => $employee->id,
            'is_calendar_default' => true,
        ]);

        $response = $this->actingAs($employee)->get(route('employee.appointments.index', ['list' => 1]));

        $response->assertOk();
    }

    public function test_visiting_calendar_sets_preference_to_calendar(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Pref Biz 3',
            'slug' => 'pref-biz-3',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
        ]);

        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
        ]);

        $this->actingAs($employee)->get(route('employee.appointments.calendar'));

        $this->assertDatabaseHas('user_appointment_view_preferences', [
            'user_id' => $employee->id,
            'is_calendar_default' => 1,
        ]);
    }
}
