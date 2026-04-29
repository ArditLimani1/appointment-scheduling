<?php

namespace App\Repositories;

use App\Models\Schedule;
use App\Models\ScheduleBreak;
use App\Repositories\Interfaces\ScheduleRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class ScheduleRepository implements ScheduleRepositoryInterface
{
    public function getByUser(int $userId): Collection
    {
        $latestPerDay = Schedule::query()
            ->selectRaw('day_of_week, MAX(effective_from) as effective_from')
            ->where('user_id', $userId)
            ->groupBy('day_of_week');

        return Schedule::query()
            ->joinSub($latestPerDay, 'latest_per_day', function ($join) {
                $join->on('schedules.day_of_week', '=', 'latest_per_day.day_of_week')
                    ->on('schedules.effective_from', '=', 'latest_per_day.effective_from');
            })
            ->where('schedules.user_id', $userId)
            ->select('schedules.*')
            ->with('breaks')
            ->orderBy('schedules.day_of_week')
            ->get();
    }

    public function findByUserAndDayForDate(int $userId, int $dayOfWeek, string $date): ?Schedule
    {
        return Schedule::query()
            ->where('user_id', $userId)
            ->where('day_of_week', $dayOfWeek)
            ->whereDate('effective_from', '<=', $date)
            ->with('breaks')
            ->orderByDesc('effective_from')
            ->first();
    }

    public function findActiveByUserAndDayForDate(int $userId, int $dayOfWeek, string $date): ?Schedule
    {
        return Schedule::query()
            ->where('user_id', $userId)
            ->where('day_of_week', $dayOfWeek)
            ->whereDate('effective_from', '<=', $date)
            ->where('is_active', true)
            ->with('breaks')
            ->orderByDesc('effective_from')
            ->first();
    }

    public function updateOrCreate(array $attributes, array $values): Schedule
    {
        return Schedule::updateOrCreate($attributes, $values);
    }

    public function deleteBreaks(Schedule $schedule): void
    {
        $schedule->breaks()->delete();
    }

    public function createBreak(Schedule $schedule, array $data): ScheduleBreak
    {
        return $schedule->breaks()->create($data);
    }
}
