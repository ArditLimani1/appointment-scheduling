<?php

namespace Tests\Feature\Employee;

use App\Enums\UserRole;
use App\Models\Business;
use App\Models\BusinessType;
use App\Models\Schedule;
use App\Models\ScheduleBreak;
use App\Models\User;
use App\Services\Interfaces\ScheduleServiceInterface;
use Carbon\Carbon;
use Database\Seeders\BusinessTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeeScheduleConfigurationVersioningTest extends TestCase
{
    use RefreshDatabase;

    public function test_standard_schedule_changes_apply_only_from_tomorrow_and_do_not_rewrite_past_weeks(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create(['role' => UserRole::Admin]);
        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Versioned Schedule Biz',
            'slug' => 'versioned-schedule-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => 'EUR',
            'is_active' => true,
            'slot_duration' => 30,
        ]);

        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
        ]);

        $mondaySchedule = Schedule::create([
            'user_id' => $employee->id,
            'day_of_week' => 0,
            'start_time' => '09:00:00',
            'end_time' => '17:00:00',
            'is_active' => true,
        ]);

        ScheduleBreak::create([
            'schedule_id' => $mondaySchedule->id,
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
        ]);

        Carbon::setTestNow(Carbon::parse('2026-04-29 10:00:00', 'UTC')); // Wednesday
        $service = app(ScheduleServiceInterface::class);

        $service->updateSchedules($employee, [
            'schedules' => [
                [
                    'day_of_week' => 0,
                    'is_active' => true,
                    'start_time' => '09:00',
                    'end_time' => '17:00',
                    'breaks' => [
                        ['start_time' => '12:00', 'end_time' => '13:00'],
                    ],
                ],
            ],
        ]);

        $pastWeekDays = $service->getDaysForRange($employee, '2026-04-20', '2026-04-26');
        $futureWeekDays = $service->getDaysForRange($employee, '2026-05-04', '2026-05-10');

        $pastMonday = collect($pastWeekDays)->firstWhere('date', '2026-04-20');
        $futureMonday = collect($futureWeekDays)->firstWhere('date', '2026-05-04');

        $this->assertNotNull($pastMonday);
        $this->assertNotNull($futureMonday);
        $this->assertSame([['start_time' => '10:00', 'end_time' => '11:00']], $pastMonday['breaks']);
        $this->assertSame([['start_time' => '12:00', 'end_time' => '13:00']], $futureMonday['breaks']);

        Carbon::setTestNow();
    }

    public function test_updating_standard_schedule_on_same_day_updates_existing_future_version(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create(['role' => UserRole::Admin]);
        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Same Day Update Biz',
            'slug' => 'same-day-update-biz',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => 'EUR',
            'is_active' => true,
            'slot_duration' => 30,
        ]);

        $employee = User::factory()->create([
            'role' => UserRole::Employee,
            'business_id' => $business->id,
        ]);

        Carbon::setTestNow(Carbon::parse('2026-04-29 10:00:00', 'UTC')); // Wednesday
        $service = app(ScheduleServiceInterface::class);

        // Create the standard Monday schedule with one break.
        $service->updateSchedules($employee, [
            'schedules' => [
                [
                    'day_of_week' => 0,
                    'is_active' => true,
                    'start_time' => '09:00',
                    'end_time' => '17:00',
                    'breaks' => [
                        ['start_time' => '12:00', 'end_time' => '13:00'],
                    ],
                ],
            ],
        ]);

        // On the same calendar day, edit the break (no new version should be spawned).
        $service->updateSchedules($employee, [
            'schedules' => [
                [
                    'day_of_week' => 0,
                    'is_active' => true,
                    'start_time' => '09:00',
                    'end_time' => '17:00',
                    'breaks' => [
                        ['start_time' => '13:00', 'end_time' => '14:00'],
                    ],
                ],
            ],
        ]);

        $mondayVersions = Schedule::query()
            ->where('user_id', $employee->id)
            ->where('day_of_week', 0)
            ->orderBy('effective_from')
            ->with('breaks')
            ->get();

        $this->assertCount(1, $mondayVersions, 'Same-day re-saves must update the existing version, not create a duplicate');
        $latest = $mondayVersions->first();
        $this->assertSame('2026-04-30', $latest->effective_from->toDateString());
        $this->assertCount(1, $latest->breaks);
        $this->assertSame('13:00', substr((string) $latest->breaks->first()->start_time, 0, 5));
        $this->assertSame('14:00', substr((string) $latest->breaks->first()->end_time, 0, 5));

        $futureMonday = collect($service->getDaysForRange($employee, '2026-05-04', '2026-05-10'))
            ->firstWhere('date', '2026-05-04');
        $this->assertSame(
            [['start_time' => '13:00', 'end_time' => '14:00']],
            $futureMonday['breaks'],
            'The latest break edit should be reflected on future Mondays'
        );

        Carbon::setTestNow();
    }
}
