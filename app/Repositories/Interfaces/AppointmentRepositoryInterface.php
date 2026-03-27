<?php

namespace App\Repositories\Interfaces;

use App\Models\Appointment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface AppointmentRepositoryInterface
{
    public function getFilteredByBusiness(int $businessId, array $filters, int $perPage = 20): LengthAwarePaginator;

    public function getUpcomingCount(int $businessId): int;

    public function getCompletedRevenue(int $businessId): float;

    public function getRecent(int $businessId, int $limit = 10): Collection;

    public function getByEmployeeAndDate(int $employeeId, string $date): Collection;

    public function create(array $data): Appointment;

    public function update(Appointment $appointment, array $data): Appointment;

    public function delete(Appointment $appointment): void;
}
