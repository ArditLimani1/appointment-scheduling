<?php

namespace App\Repositories\Interfaces;

use App\Models\Schedule;
use App\Models\ScheduleBreak;
use Illuminate\Database\Eloquent\Collection;

interface ScheduleRepositoryInterface
{
    public function getByUser(int $userId): Collection;

    public function findByUserAndDayForDate(int $userId, int $dayOfWeek, string $date): ?Schedule;

    public function findActiveByUserAndDayForDate(int $userId, int $dayOfWeek, string $date): ?Schedule;

    public function updateOrCreate(array $attributes, array $values): Schedule;

    public function deleteBreaks(Schedule $schedule): void;

    public function createBreak(Schedule $schedule, array $data): ScheduleBreak;
}
