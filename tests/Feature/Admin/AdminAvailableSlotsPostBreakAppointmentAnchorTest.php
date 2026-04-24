<?php

namespace Tests\Feature\Admin;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Models\Appointment;
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

/**
 * After a break (13:00-14:00) followed by a 45-min appointment (14:00-14:45), the next
 * slot must re-anchor to the appointment end (14:45), NOT stay on the pre-break :00/:30
 * phase. This enforces Rule 2 inside a post-break free interval so dragging a follow-up
 * 30-min service sees slots at 14:45, 15:15, 15:45, ... rather than 15:00, 15:30, 16:00.
 */
class AdminAvailableSlotsPostBreakAppointmentAnchorTest extends TestCase
{
    use RefreshDatabase;

    public function test_slot_after_post_break_appointment_anchors_to_appointment_end(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create(['role' => UserRole::Admin]);

        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Anchor Biz',
            'slug' => 'anchor-biz',
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
            'name' => 'Prerje 45',
            'description' => 'Test',
            'duration' => 45,
            'price' => 28,
            'is_active' => true,
            'sort_order' => 0,
        ]);

        $service30 = Service::create([
            'business_id' => $business->id,
            'name' => 'Stilim 30',
            'description' => 'Test',
            'duration' => 30,
            'price' => 18,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $employee->services()->sync([$service45->id, $service30->id]);

        $monday = '2026-06-08';

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

        Appointment::create([
            'business_id' => $business->id,
            'employee_id' => $employee->id,
            'service_id' => $service45->id,
            'client_first_name' => 'A',
            'client_last_name' => 'B',
            'client_phone' => '000',
            'date' => $monday,
            'start_time' => '14:00',
            'end_time' => '14:45',
            'price' => 28,
            'status' => AppointmentStatus::Pending,
        ]);

        /** @var BookingServiceInterface $booking */
        $booking = $this->app->make(BookingServiceInterface::class);

        $slots = $booking->getAdminAvailableSlots($business, [
            'employee_id' => $employee->id,
            'service_id' => $service30->id,
            'date' => $monday,
        ]);

        $this->assertContains('14:45', $slots, 'First post-appointment slot must start at 14:45.');
        $this->assertContains('15:15', $slots);
        $this->assertContains('15:45', $slots);
        $this->assertNotContains('15:00', $slots, 'Post-appointment grid must not stay on the :00/:30 day phase.');
        $this->assertNotContains('15:30', $slots);
    }
}
