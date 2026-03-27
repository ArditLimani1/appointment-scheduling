<?php

namespace App\Repositories\Interfaces;

use App\Models\Schedule;
use App\Models\ScheduleBreak;
use Illuminate\Database\Eloquent\Collection;

interface ScheduleRepositoryInterface
{
    public function getByUser(int $userId): Collection;

    public function findActiveByUserAndDay(int $userId, int $dayOfWeek): ?Schedule;

    public function updateOrCreate(array $attributes, array $values): Schedule;

    public function deleteBreaks(Schedule $schedule): void;

    public function createBreak(Schedule $schedule, array $data): ScheduleBreak;
}
