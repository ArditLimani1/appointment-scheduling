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
 * Formally locks in the three slot-placement rules:
 *   1) Step = min(business slot grid, service duration).
 *   2) Free interval after an appointment re-anchors to the appointment end, then steps by rule 1.
 *   3) Free interval after a break re-anchors to the break end, then steps by rule 1 — regardless
 *      of the step rhythm used before the break.
 *
 * Shared setup for the reference business: 30-min grid, 9:00–18:00 schedule, 13:00–14:00 break, 45-min service.
 */
class AdminAvailableSlotsUserScenarioTest extends TestCase
{
    use RefreshDatabase;

    public function test_slot_14_00_after_break_is_offered_when_pre_break_appointment_occupies_12_00_to_12_45(): void
    {
        [$business, $employee, $service45] = $this->seedBarbershopFixtures('user-scenario-14-00-after-break');
        $monday = '2026-06-08';
        $this->createScheduleWithLunchBreak($employee);

        Appointment::create($this->appointmentAttrs($business, $employee, $service45, $monday, '12:00', '12:45'));

        $slots = $this->resolveSlots($business, $employee, $service45, $monday);

        $this->assertContains('14:00', $slots, 'First post-break slot must be offered regardless of pre-break bookings.');
        $this->assertContains('14:30', $slots);
        $this->assertContains('15:00', $slots);
        $this->assertNotContains('13:00', $slots);
        $this->assertNotContains('13:30', $slots);
    }

    public function test_next_slot_after_appointment_anchors_to_appointment_end_and_steps_by_grid(): void
    {
        [$business, $employee, $service45] = $this->seedBarbershopFixtures('rule-2-anchor-after-appointment');
        $monday = '2026-06-08';
        $this->createScheduleWithLunchBreak($employee);

        Appointment::create($this->appointmentAttrs($business, $employee, $service45, $monday, '09:00', '09:45'));

        $slots = $this->resolveSlots($business, $employee, $service45, $monday);

        foreach (['09:45', '10:15', '10:45', '11:15', '11:45', '12:15'] as $expected) {
            $this->assertContains($expected, $slots, "Rule 2: after the 09:00–09:45 appointment, slot {$expected} (step of 30 min) must be offered.");
        }
        $this->assertNotContains('09:00', $slots);
        $this->assertNotContains('09:30', $slots);
        $this->assertNotContains('10:00', $slots);
        $this->assertNotContains('12:45', $slots, 'Step of 30 from 09:45 would land on 12:45 but 12:45+45min crosses the break — must be excluded.');
    }

    public function test_slots_after_break_anchor_to_break_end_regardless_of_pre_break_rhythm(): void
    {
        [$business, $employee, $service45] = $this->seedBarbershopFixtures('rule-3-anchor-after-break');
        $monday = '2026-06-08';
        $this->createScheduleWithLunchBreak($employee);

        Appointment::create($this->appointmentAttrs($business, $employee, $service45, $monday, '09:00', '09:45'));

        $slots = $this->resolveSlots($business, $employee, $service45, $monday);

        $this->assertContains('14:00', $slots, 'Rule 3: first slot after break must land on the break end (14:00), not 14:15.');
        foreach (['14:30', '15:00', '15:30', '16:00', '16:30', '17:00'] as $expected) {
            $this->assertContains($expected, $slots);
        }
        $this->assertNotContains('14:15', $slots);
        $this->assertNotContains('14:45', $slots);
    }

    /**
     * @return array{Business, User, Service}
     */
    private function seedBarbershopFixtures(string $slugSuffix): array
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create(['role' => UserRole::Admin]);

        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Biz '.$slugSuffix,
            'slug' => 'biz-'.$slugSuffix,
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
            'name' => 'Prerje e flokëve',
            'description' => 'Test',
            'duration' => 45,
            'price' => 28,
            'is_active' => true,
            'sort_order' => 0,
        ]);

        $employee->services()->sync([$service45->id]);

        return [$business, $employee, $service45];
    }

    private function createScheduleWithLunchBreak(User $employee): Schedule
    {
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

        return $schedule;
    }

    /**
     * @return array<string, mixed>
     */
    private function appointmentAttrs(Business $business, User $employee, Service $service, string $date, string $start, string $end): array
    {
        $this->assertSame(0, Carbon::parse($date)->dayOfWeekIso - 1);

        return [
            'business_id' => $business->id,
            'employee_id' => $employee->id,
            'service_id' => $service->id,
            'client_first_name' => 'A',
            'client_last_name' => 'B',
            'client_phone' => '000',
            'client_email' => null,
            'client_notes' => null,
            'date' => $date,
            'start_time' => $start,
            'end_time' => $end,
            'price' => $service->price,
            'status' => AppointmentStatus::Pending,
        ];
    }

    /**
     * @return list<string>
     */
    private function resolveSlots(Business $business, User $employee, Service $service, string $date): array
    {
        /** @var BookingServiceInterface $booking */
        $booking = $this->app->make(BookingServiceInterface::class);

        return $booking->getAdminAvailableSlots($business, [
            'employee_id' => $employee->id,
            'service_id' => $service->id,
            'date' => $date,
        ]);
    }
}
