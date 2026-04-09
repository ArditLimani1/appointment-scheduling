<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\Business;
use App\Models\BusinessType;
use App\Models\User;
use Database\Seeders\BusinessTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AppointmentCalendarTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_appointments_calendar(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        Business::create([
            'owner_id' => $admin->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Calendar Test Biz',
            'slug' => 'calendar-test-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
        ]);

        $response = $this->actingAs($admin)->get(route('admin.appointments.calendar'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Appointments/Calendar')
            ->has('range_start')
            ->has('range_end')
            ->has('column_dates')
            ->has('calendar_view')
            ->has('appointments')
            ->has('employees')
            ->has('services')
            ->where('filters.status', ['pending', 'confirmed']));
    }
}
