<?php

namespace App\Repositories\Interfaces;

use App\Models\ScheduleOverride;
use App\Models\ScheduleOverrideBreak;
use Illuminate\Database\Eloquent\Collection;

interface ScheduleOverrideRepositoryInterface
{
    public function findByUserAndDate(int $userId, string $date): ?ScheduleOverride;

    public function findActiveByUserAndDate(int $userId, string $date): ?ScheduleOverride;

    public function getByUserAndDateRange(int $userId, string $dateFrom, string $dateTo): Collection;

    public function upsertForDate(int $userId, string $date, array $values): ScheduleOverride;

    public function deleteForDate(int $userId, string $date): void;

    public function deleteForUserFromDate(int $userId, string $dateFrom): void;

    public function deleteBreaks(ScheduleOverride $override): void;

    public function createBreak(ScheduleOverride $override, array $data): ScheduleOverrideBreak;
}
