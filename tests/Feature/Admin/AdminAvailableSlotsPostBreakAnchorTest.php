<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\Business;
use App\Models\BusinessType;
use App\Models\Schedule;
use App\Models\ScheduleBreak;
use App\Models\Service;
use App\Models\User;
use App\Services\Interfaces\BookingServiceInterface;
use Carbon\Carbon;
use Database\Seeders\BusinessTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAvailableSlotsPostBreakAnchorTest extends TestCase
{
    use RefreshDatabase;

    public function test_first_slot_after_break_aligns_to_interval_start_not_day_phase(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create([
            'role' => UserRole::Admin,
        ]);

        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Post Break Anchor Biz',
            'slug' => 'post-break-anchor-biz',
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
            'name' => 'Haircut 45',
            'description' => 'Test',
            'duration' => 45,
            'price' => 20,
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

        /** @var BookingServiceInterface $booking */
        $booking = $this->app->make(BookingServiceInterface::class);

        $slots = $booking->getAdminAvailableSlots($business, [
            'employee_id' => $employee->id,
            'service_id' => $service45->id,
            'date' => $monday,
        ]);

        $this->assertContains('14:00', $slots);
        $this->assertNotContains('14:15', $slots);
    }
}
