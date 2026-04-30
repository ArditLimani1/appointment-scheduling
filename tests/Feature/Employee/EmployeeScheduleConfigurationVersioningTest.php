<?php

namespace Tests\Feature\Employee;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Models\Appointment;
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

    public function test_day_off_modal_and_auto_cancel_consider_only_future_pending_or_confirmed_appointments(): void
    {
        $this->seed(BusinessTypeSeeder::class);

        $owner = User::factory()->create(['role' => UserRole::Admin]);
        $business = Business::create([
            'owner_id' => $owner->id,
            'business_type_id' => BusinessType::query()->value('id'),
            'name' => 'Day Off Rules Biz',
            'slug' => 'day-off-rules-biz',
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

        Carbon::setTestNow(Carbon::parse('2026-05-01 09:00:00', 'UTC'));

        $today = '2026-05-01';
        $future = '2026-05-02';

        Appointment::create([
            'booking_reference' => 'A1',
            'business_id' => $business->id,
            'employee_id' => $employee->id,
            'client_first_name' => 'Past',
            'client_last_name' => 'Today',
            'date' => $today,
            'start_time' => '08:00:00',
            'end_time' => '08:30:00',
            'price' => 10,
            'status' => AppointmentStatus::Confirmed,
        ]);
        Appointment::create([
            'booking_reference' => 'A2',
            'business_id' => $business->id,
            'employee_id' => $employee->id,
            'client_first_name' => 'Future',
            'client_last_name' => 'Today',
            'date' => $today,
            'start_time' => '09:00:00',
            'end_time' => '09:30:00',
            'price' => 10,
            'status' => AppointmentStatus::Pending,
        ]);
        Appointment::create([
            'booking_reference' => 'A3',
            'business_id' => $business->id,
            'employee_id' => $employee->id,
            'client_first_name' => 'Cancelled',
            'client_last_name' => 'Future',
            'date' => $future,
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
            'price' => 10,
            'status' => AppointmentStatus::Cancelled,
        ]);
        Appointment::create([
            'booking_reference' => 'A4',
            'business_id' => $business->id,
            'employee_id' => $employee->id,
            'client_first_name' => 'Confirmed',
            'client_last_name' => 'Future',
            'date' => $future,
            'start_time' => '11:00:00',
            'end_time' => '11:30:00',
            'price' => 10,
            'status' => AppointmentStatus::Confirmed,
        ]);

        $service = app(ScheduleServiceInterface::class);

        $days = $service->getDaysForRange($employee, $today, $future);
        $todayRow = collect($days)->firstWhere('date', $today);
        $futureRow = collect($days)->firstWhere('date', $future);

        $this->assertNotNull($todayRow);
        $this->assertNotNull($futureRow);
        $this->assertSame(['09:00'], collect($todayRow['appointments'])->pluck('start_time')->all());
        $this->assertSame(['11:00'], collect($futureRow['appointments'])->pluck('start_time')->all());

        $service->saveOverrides($employee, [
            'days' => [
                [
                    'date' => $today,
                    'is_active' => false,
                    'is_overridden' => true,
                    'start_time' => '09:00',
                    'end_time' => '17:00',
                    'breaks' => [],
                ],
                [
                    'date' => $future,
                    'is_active' => false,
                    'is_overridden' => true,
                    'start_time' => '09:00',
                    'end_time' => '17:00',
                    'breaks' => [],
                ],
            ],
        ]);

        $this->assertSame(AppointmentStatus::Confirmed, Appointment::query()->where('booking_reference', 'A1')->firstOrFail()->status);
        $this->assertSame(AppointmentStatus::Cancelled, Appointment::query()->where('booking_reference', 'A2')->firstOrFail()->status);
        $this->assertSame(AppointmentStatus::Cancelled, Appointment::query()->where('booking_reference', 'A3')->firstOrFail()->status);
        $this->assertSame(AppointmentStatus::Cancelled, Appointment::query()->where('booking_reference', 'A4')->firstOrFail()->status);

        Carbon::setTestNow();
    }
}
