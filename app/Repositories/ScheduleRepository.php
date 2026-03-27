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
        return Schedule::where('user_id', $userId)
            ->with('breaks')
            ->orderBy('day_of_week')
            ->get();
    }

    public function findActiveByUserAndDay(int $userId, int $dayOfWeek): ?Schedule
    {
        return Schedule::where('user_id', $userId)
            ->where('day_of_week', $dayOfWeek)
            ->where('is_active', true)
            ->with('breaks')
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
