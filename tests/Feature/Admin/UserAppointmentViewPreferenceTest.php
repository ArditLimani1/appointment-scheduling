<?php

namespace Tests\Feature\Admin;

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

    public function test_admin_with_calendar_preference_is_redirected_from_index_to_calendar(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        Business::create([
            'owner_id' => $admin->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Pref Biz Admin',
            'slug' => 'pref-biz-admin',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
        ]);

        UserAppointmentViewPreference::create([
            'user_id' => $admin->id,
            'is_calendar_default' => true,
        ]);

        $response = $this->actingAs($admin)->get(route('admin.appointments.index'));

        $response->assertRedirect(route('admin.appointments.calendar'));
    }

    public function test_list_query_parameter_allows_table_view_when_calendar_is_preferred(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        Business::create([
            'owner_id' => $admin->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Pref Biz Admin 2',
            'slug' => 'pref-biz-admin-2',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
        ]);

        UserAppointmentViewPreference::create([
            'user_id' => $admin->id,
            'is_calendar_default' => true,
        ]);

        $response = $this->actingAs($admin)->get(route('admin.appointments.index', ['list' => 1]));

        $response->assertOk();
    }

    public function test_visiting_calendar_sets_preference_to_calendar(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        Business::create([
            'owner_id' => $admin->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Pref Biz Admin 3',
            'slug' => 'pref-biz-admin-3',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
        ]);

        $this->actingAs($admin)->get(route('admin.appointments.calendar'));

        $this->assertDatabaseHas('user_appointment_view_preferences', [
            'user_id' => $admin->id,
            'is_calendar_default' => 1,
        ]);
    }
}
