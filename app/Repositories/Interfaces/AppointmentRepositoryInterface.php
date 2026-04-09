<?php

namespace App\Repositories\Interfaces;

use App\Models\Appointment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface AppointmentRepositoryInterface
{
    public function getFilteredByBusiness(int $businessId, array $filters, int $perPage = 10): LengthAwarePaginator;

    /**
     * @param  array{employee_id?: int, statuses?: list<string>}  $filters
     */
    public function getForBusinessDateRange(int $businessId, string $from, string $to, array $filters = []): Collection;

    public function getUpcomingCount(int $businessId): int;

    public function getCompletedRevenue(int $businessId): float;

    public function getCurrentMonthRevenue(int $businessId): float;

    public function getRecent(int $businessId, int $limit = 10, ?string $date = null): Collection;

    public function getByEmployeeAndDate(int $employeeId, string $date, ?int $excludeAppointmentId = null): Collection;

    public function create(array $data): Appointment;

    public function update(Appointment $appointment, array $data): Appointment;

    public function delete(Appointment $appointment): void;
}
