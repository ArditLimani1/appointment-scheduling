<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Schedule;
use App\Models\ScheduleBreak;
use App\Models\User;
use App\Support\DefaultEmployeeSchedule;
use Illuminate\Database\Seeder;

class ScheduleSeeder extends Seeder
{
    public function run(): void
    {
        $employees = User::query()
            ->where('is_active', true)
            ->whereNotNull('business_id')
            ->where(function ($q) {
                $q->where('role', UserRole::Employee)
                    ->orWhere(function ($q2) {
                        $q2->where('role', UserRole::Admin)
                            ->where('also_works_as_staff', true);
                    });
            })
            ->get();

        foreach ($employees as $employee) {
            foreach (DefaultEmployeeSchedule::week() as $day) {
                $existing = Schedule::where('user_id', $employee->id)
                    ->where('day_of_week', $day['day_of_week'])
                    ->first();

                if ($existing) {
                    continue;
                }

                $schedule = Schedule::create([
                    'user_id' => $employee->id,
                    'day_of_week' => $day['day_of_week'],
                    'start_time' => $day['start_time'],
                    'end_time' => $day['end_time'],
                    'is_active' => $day['is_active'],
                ]);

                foreach ($day['breaks'] as $break) {
                    ScheduleBreak::create([
                        'schedule_id' => $schedule->id,
                        'start_time' => $break['start_time'],
                        'end_time' => $break['end_time'],
                    ]);
                }
            }
        }

        $this->command->info("Schedules seeded for {$employees->count()} employee(s).");
    }
}
