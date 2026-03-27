<?php

namespace Database\Seeders;

use App\Models\Schedule;
use App\Models\ScheduleBreak;
use App\Models\User;
use Illuminate\Database\Seeder;

class ScheduleSeeder extends Seeder
{
    public function run(): void
    {
        $employees = User::where('role', 'employee')->where('is_active', true)->get();

        foreach ($employees as $employee) {
            // Monday (0) → Saturday (5), closed Sunday (6)
            foreach (range(0, 5) as $day) {
                $existing = Schedule::where('user_id', $employee->id)
                    ->where('day_of_week', $day)
                    ->first();

                if ($existing) {
                    continue;
                }

                $schedule = Schedule::create([
                    'user_id' => $employee->id,
                    'day_of_week' => $day,
                    'start_time' => '09:00',
                    'end_time' => '18:00',
                    'is_active' => true,
                ]);

                ScheduleBreak::create([
                    'schedule_id' => $schedule->id,
                    'start_time' => '13:00',
                    'end_time' => '14:00',
                ]);
            }
        }

        $this->command->info("Schedules seeded for {$employees->count()} employee(s).");
    }
}
