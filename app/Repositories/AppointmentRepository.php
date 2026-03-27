<?php

namespace App\Repositories;

use App\Models\Appointment;
use App\Repositories\Interfaces\AppointmentRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class AppointmentRepository implements AppointmentRepositoryInterface
{
    public function getFilteredByBusiness(int $businessId, array $filters, int $perPage = 20): LengthAwarePaginator
    {
        $query = Appointment::with(['employee', 'service'])
            ->where('business_id', $businessId);

        if (! empty($filters['employee_id'])) {
            $query->where('employee_id', $filters['employee_id']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('date', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('date', '<=', $filters['date_to']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->latest('date')->latest('start_time')->paginate($perPage)->withQueryString();
    }

    public function getUpcomingCount(int $businessId): int
    {
        return Appointment::where('business_id', $businessId)
            ->whereIn('status', ['pending', 'confirmed'])
            ->whereDate('date', '>=', Carbon::today())
            ->count();
    }

    public function getCompletedRevenue(int $businessId): float
    {
        return (float) Appointment::where('business_id', $businessId)
            ->where('status', 'completed')
            ->sum('price');
    }

    public function getRecent(int $businessId, int $limit = 10): Collection
    {
        return Appointment::with(['employee', 'service'])
            ->where('business_id', $businessId)
            ->latest()
            ->take($limit)
            ->get();
    }

    public function getByEmployeeAndDate(int $employeeId, string $date): Collection
    {
        return Appointment::where('employee_id', $employeeId)
            ->whereDate('date', $date)
            ->whereNotIn('status', ['cancelled'])
            ->get(['start_time', 'end_time']);
    }

    public function create(array $data): Appointment
    {
        return Appointment::create($data);
    }

    public function update(Appointment $appointment, array $data): Appointment
    {
        $appointment->update($data);

        return $appointment;
    }

    public function delete(Appointment $appointment): void
    {
        $appointment->delete();
    }
}
