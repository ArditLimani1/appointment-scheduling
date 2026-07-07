<?php

namespace App\Support;

use App\Models\Schedule;
use App\Models\ScheduleBreak;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DefaultEmployeeSchedule
{
    public const START_TIME = '09:00';

    public const END_TIME = '17:00';

    public const BREAK_START = '12:00';

    public const BREAK_END = '13:00';

    /**
     * @return list<array{day_of_week: int, is_active: bool, start_time: string, end_time: string, breaks: list<array{start_time: string, end_time: string}>}>
     */
    public static function week(): array
    {
        return array_map(fn (int $day) => self::day($day), range(0, 6));
    }

    /**
     * @return array{day_of_week: int, is_active: bool, start_time: string, end_time: string, breaks: list<array{start_time: string, end_time: string}>}
     */
    public static function day(int $dayOfWeek): array
    {
        $isWeekday = $dayOfWeek >= 0 && $dayOfWeek <= 4;

        return [
            'day_of_week' => $dayOfWeek,
            'is_active' => $isWeekday,
            'start_time' => self::START_TIME,
            'end_time' => self::END_TIME,
            'breaks' => $isWeekday
                ? [['start_time' => self::BREAK_START, 'end_time' => self::BREAK_END]]
                : [],
        ];
    }

    public static function seedIfEmpty(User $user): void
    {
        if (Schedule::query()->where('user_id', $user->id)->exists()) {
            return;
        }

        DB::transaction(function () use ($user) {
            foreach (self::week() as $day) {
                $schedule = Schedule::create([
                    'user_id' => $user->id,
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
        });
    }
}
