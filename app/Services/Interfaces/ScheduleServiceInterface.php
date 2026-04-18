<?php

namespace App\Services\Interfaces;

use App\Models\Business;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

interface ScheduleServiceInterface
{
    public function getSchedules(User $user): Collection;

    public function updateSchedules(User $user, array $data): void;

    public function getDaysForRange(User $user, string $dateFrom, string $dateTo): array;

    /**
     * Break windows per calendar date (Y-m-d) for schedule visualization.
     *
     * @return array<string, list<array{start: string, end: string}>>
     */
    public function getBreakIntervalsKeyedByDate(User $user, string $dateFrom, string $dateTo): array;

    /**
     * Union of all employees' break intervals per date (admin all-staff calendar — avoid red conflict tint on breaks).
     *
     * @return array<string, list<array{start: string, end: string}>>
     */
    public function getMergedBreakIntervalsForBusiness(Business $business, string $dateFrom, string $dateTo): array;

    /**
     * Calendar dates (Y-m-d) where the employee is not active (day off).
     *
     * @return list<string>
     */
    public function getDayOffDatesForRange(User $user, string $dateFrom, string $dateTo): array;

    /**
     * Per-employee break intervals and day-off dates for calendar drag overlays (string keys = user id).
     *
     * @return array{breaks: array<string, array<string, list<array{start: string, end: string}>>>, day_offs: array<string, list<string>>}
     */
    public function getCalendarBreakAndDayOffMapsForEmployees(Business $business, string $dateFrom, string $dateTo): array;

    public function saveOverrides(User $user, array $data): void;
}
