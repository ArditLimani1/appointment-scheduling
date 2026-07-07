<?php

namespace Tests\Feature\Support;

use App\Enums\UserRole;
use App\Models\Business;
use App\Models\BusinessType;
use App\Models\Schedule;
use App\Models\ScheduleBreak;
use App\Models\User;
use App\Services\Interfaces\EmployeeServiceInterface;
use App\Support\DefaultEmployeeSchedule;
use Database\Seeders\BusinessTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DefaultEmployeeScheduleTest extends TestCase
{
    use RefreshDatabase;

    private function makeBusiness(): Business
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create(['role' => UserRole::Admin]);

        return Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Default Schedule Biz',
            'slug' => 'default-schedule-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => 'EUR',
            'is_active' => true,
            'slot_duration' => 30,
        ]);
    }

    public function test_new_employee_gets_monday_to_friday_nine_to_five_with_lunch_break(): void
    {
        $business = $this->makeBusiness();

        $employee = app(EmployeeServiceInterface::class)->store($business, [
            'name' => 'Staff Member',
            'email' => 'staff@example.com',
            'password' => 'password123',
        ]);

        $schedules = Schedule::query()
            ->where('user_id', $employee->id)
            ->orderBy('day_of_week')
            ->with('breaks')
            ->get();

        $this->assertCount(7, $schedules);

        foreach (range(0, 4) as $day) {
            $schedule = $schedules->firstWhere('day_of_week', $day);
            $this->assertTrue($schedule->is_active);
            $this->assertSame('09:00', substr((string) $schedule->start_time, 0, 5));
            $this->assertSame('17:00', substr((string) $schedule->end_time, 0, 5));
            $this->assertCount(1, $schedule->breaks);
            $this->assertSame('12:00', substr((string) $schedule->breaks->first()->start_time, 0, 5));
            $this->assertSame('13:00', substr((string) $schedule->breaks->first()->end_time, 0, 5));
        }

        foreach (range(5, 6) as $day) {
            $schedule = $schedules->firstWhere('day_of_week', $day);
            $this->assertFalse($schedule->is_active);
            $this->assertCount(0, $schedule->breaks);
        }
    }

    public function test_seed_if_empty_does_not_overwrite_existing_schedules(): void
    {
        $business = $this->makeBusiness();
        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
        ]);

        $existing = Schedule::create([
            'user_id' => $employee->id,
            'day_of_week' => 0,
            'start_time' => '10:00:00',
            'end_time' => '16:00:00',
            'is_active' => true,
        ]);

        ScheduleBreak::create([
            'schedule_id' => $existing->id,
            'start_time' => '13:30:00',
            'end_time' => '14:00:00',
        ]);

        DefaultEmployeeSchedule::seedIfEmpty($employee);

        $this->assertSame(1, Schedule::query()->where('user_id', $employee->id)->count());
        $this->assertSame('10:00:00', (string) $existing->fresh()->start_time);
    }

    public function test_owner_enabling_also_works_as_staff_seeds_default_schedule(): void
    {
        $business = $this->makeBusiness();
        $owner = $business->owner;

        $owner->syncAlsoWorksAsStaff($business, true);

        $monday = Schedule::query()
            ->where('user_id', $owner->id)
            ->where('day_of_week', 0)
            ->with('breaks')
            ->first();

        $this->assertNotNull($monday);
        $this->assertTrue($monday->is_active);
        $this->assertCount(1, $monday->breaks);
        $this->assertSame('12:00', substr((string) $monday->breaks->first()->start_time, 0, 5));
        $this->assertSame('13:00', substr((string) $monday->breaks->first()->end_time, 0, 5));
    }
}
