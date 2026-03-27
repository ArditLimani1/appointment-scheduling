<?php

namespace App\Repositories;

use App\Enums\AppointmentStatus;
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

        if (array_key_exists('employee_id', $filters)) {
            $query->where('employee_id', (int) $filters['employee_id']);
        }

        if (array_key_exists('date_from', $filters)) {
            $query->whereDate('date', '>=', $filters['date_from']);
        }

        if (array_key_exists('date_to', $filters)) {
            $query->whereDate('date', '<=', $filters['date_to']);
        }

        if (array_key_exists('status', $filters)) {
            $status = AppointmentStatus::tryFrom((string) $filters['status']);
            if ($status !== null) {
                $query->where('status', $status);
            }
        }

        return $query->latest('date')->latest('start_time')->paginate($perPage)->withQueryString();
    }

    public function getUpcomingCount(int $businessId): int
    {
        return Appointment::where('business_id', $businessId)
            ->whereIn('status', [AppointmentStatus::Pending, AppointmentStatus::Confirmed])
            ->whereDate('date', '>=', Carbon::today())
            ->count();
    }

    public function getCompletedRevenue(int $businessId): float
    {
        return (float) Appointment::where('business_id', $businessId)
            ->where('status', AppointmentStatus::Completed)
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
            ->where('status', '!=', AppointmentStatus::Cancelled)
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
