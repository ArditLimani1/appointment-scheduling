<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\Business;
use App\Models\BusinessType;
use App\Models\Schedule;
use App\Models\Service;
use App\Models\User;
use App\Services\Interfaces\BookingServiceInterface;
use Carbon\Carbon;
use Database\Seeders\BusinessTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAvailableSlotsStepTest extends TestCase
{
    use RefreshDatabase;

    public function test_longer_service_than_business_grid_uses_finer_business_grid_step(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Slot Step Biz',
            'slug' => 'slot-step-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
            'slot_duration' => 15,
        ]);

        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
        ]);

        $service30 = Service::create([
            'business_id' => $business->id,
            'name' => 'Beard Sculpt',
            'description' => 'Test',
            'duration' => 30,
            'price' => 20,
            'is_active' => true,
            'sort_order' => 0,
        ]);

        $employee->services()->sync([$service30->id]);

        $monday = '2026-06-08';
        $this->assertSame(0, Carbon::parse($monday)->dayOfWeekIso - 1);

        Schedule::create([
            'user_id' => $employee->id,
            'day_of_week' => 0,
            'start_time' => '09:00:00',
            'end_time' => '18:00:00',
            'is_active' => true,
        ]);

        /** @var BookingServiceInterface $booking */
        $booking = $this->app->make(BookingServiceInterface::class);

        $slots = $booking->getAdminAvailableSlots($business, [
            'employee_id' => $employee->id,
            'service_id' => $service30->id,
            'date' => $monday,
        ]);

        $this->assertContains('11:15', $slots, '30 min service with 15 min grid should offer finer :15 starts');
        $this->assertContains('10:45', $slots);
        $this->assertContains('11:00', $slots);
        $this->assertContains('11:30', $slots);
    }

    public function test_short_service_uses_business_grid_step(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Slot Step Biz 2',
            'slug' => 'slot-step-biz-2',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'is_active' => true,
            'slot_duration' => 15,
        ]);

        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
        ]);

        $service15 = Service::create([
            'business_id' => $business->id,
            'name' => 'Express Trim',
            'description' => 'Test',
            'duration' => 15,
            'price' => 20,
            'is_active' => true,
            'sort_order' => 0,
        ]);

        $employee->services()->sync([$service15->id]);

        $monday = '2026-06-08';

        Schedule::create([
            'user_id' => $employee->id,
            'day_of_week' => 0,
            'start_time' => '09:00:00',
            'end_time' => '18:00:00',
            'is_active' => true,
        ]);

        /** @var BookingServiceInterface $booking */
        $booking = $this->app->make(BookingServiceInterface::class);

        $slots = $booking->getAdminAvailableSlots($business, [
            'employee_id' => $employee->id,
            'service_id' => $service15->id,
            'date' => $monday,
        ]);

        $this->assertContains('11:15', $slots);
    }
}
