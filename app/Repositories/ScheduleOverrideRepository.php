<?php

namespace App\Repositories;

use App\Models\ScheduleOverride;
use App\Models\ScheduleOverrideBreak;
use App\Repositories\Interfaces\ScheduleOverrideRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class ScheduleOverrideRepository implements ScheduleOverrideRepositoryInterface
{
    public function findByUserAndDate(int $userId, string $date): ?ScheduleOverride
    {
        return ScheduleOverride::where('user_id', $userId)
            ->whereDate('date', $date)
            ->with('breaks')
            ->first();
    }

    public function findActiveByUserAndDate(int $userId, string $date): ?ScheduleOverride
    {
        return ScheduleOverride::where('user_id', $userId)
            ->whereDate('date', $date)
            ->where('is_active', true)
            ->with('breaks')
            ->first();
    }

    public function getByUserAndDateRange(int $userId, string $dateFrom, string $dateTo): Collection
    {
        return ScheduleOverride::where('user_id', $userId)
            ->whereBetween('date', [$dateFrom, $dateTo])
            ->with('breaks')
            ->orderBy('date')
            ->get();
    }

    public function upsertForDate(int $userId, string $date, array $values): ScheduleOverride
    {
        $override = ScheduleOverride::firstOrNew([
            'user_id' => $userId,
            'date'    => $date,
        ]);

        $override->fill($values);
        $override->save();

        return $override->load('breaks');
    }

    public function deleteForDate(int $userId, string $date): void
    {
        ScheduleOverride::where('user_id', $userId)
            ->whereDate('date', $date)
            ->delete();
    }

    public function deleteBreaks(ScheduleOverride $override): void
    {
        $override->breaks()->delete();
    }

    public function createBreak(ScheduleOverride $override, array $data): ScheduleOverrideBreak
    {
        return $override->breaks()->create($data);
    }
}
