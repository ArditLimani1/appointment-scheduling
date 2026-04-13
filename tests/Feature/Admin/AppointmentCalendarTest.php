<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\Business;
use App\Models\BusinessType;
use App\Models\Service;
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
            ->has('slot_duration')
            ->has('calendar_day_breaks')
            ->has('calendar_day_offs')
            ->where('slot_duration', fn ($v) => is_int($v) && $v >= 5 && $v <= 120)
            ->where('filters.status', ['pending', 'confirmed']));
    }

    public function test_calendar_uses_business_slot_duration_for_grid_lines_not_shortest_service(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $admin = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $business = Business::create([
            'owner_id' => $admin->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Slot Min Biz',
            'slug' => 'slot-min-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
            'slot_duration' => 30,
        ]);

        Service::create([
            'business_id' => $business->id,
            'name' => 'Quick',
            'description' => 'x',
            'duration' => 15,
            'price' => 20,
            'is_active' => true,
            'sort_order' => 0,
        ]);

        Service::create([
            'business_id' => $business->id,
            'name' => 'Long',
            'description' => 'x',
            'duration' => 90,
            'price' => 80,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $response = $this->actingAs($admin)->get(route('admin.appointments.calendar'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->where('slot_duration', 30));
    }
}
