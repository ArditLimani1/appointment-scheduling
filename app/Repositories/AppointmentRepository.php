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
    public function getFilteredByBusiness(int $businessId, array $filters, int $perPage = 10): LengthAwarePaginator
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

        if (array_key_exists('statuses', $filters) && is_array($filters['statuses']) && $filters['statuses'] !== []) {
            $cases = array_values(array_filter(array_map(
                fn ($s) => AppointmentStatus::tryFrom((string) $s),
                $filters['statuses'],
            )));
            if ($cases !== []) {
                $query->whereIn('status', $cases);
            }
        }

        if (array_key_exists('service_id', $filters) && $filters['service_id'] !== null && $filters['service_id'] !== '') {
            $query->where('service_id', (int) $filters['service_id']);
        }

        if (! empty($filters['search']) && is_string($filters['search'])) {
            $term = trim($filters['search']);
            if ($term !== '') {
                $like = '%'.addcslashes($term, '%_\\').'%';
                $query->where(function ($q) use ($like) {
                    $q->where('client_first_name', 'like', $like)
                        ->orWhere('client_last_name', 'like', $like);
                });
            }
        }

        return $query->latest('date')->latest('start_time')->paginate($perPage)->withQueryString();
    }

    public function getForBusinessDateRange(int $businessId, string $from, string $to, array $filters = []): Collection
    {
        $query = Appointment::with(['employee', 'service'])
            ->where('business_id', $businessId)
            ->whereDate('date', '>=', $from)
            ->whereDate('date', '<=', $to);

        if (array_key_exists('employee_id', $filters) && $filters['employee_id'] !== null && $filters['employee_id'] !== '') {
            $query->where('employee_id', (int) $filters['employee_id']);
        }

        if (array_key_exists('statuses', $filters) && is_array($filters['statuses']) && $filters['statuses'] !== []) {
            $cases = array_values(array_filter(array_map(
                fn ($s) => AppointmentStatus::tryFrom((string) $s),
                $filters['statuses'],
            )));
            if ($cases !== []) {
                $query->whereIn('status', $cases);
            }
        }

        if (array_key_exists('service_id', $filters) && $filters['service_id'] !== null && $filters['service_id'] !== '') {
            $query->where('service_id', (int) $filters['service_id']);
        }

        return $query->orderBy('date')->orderBy('start_time')->get();
    }

    public function getUpcomingCount(int $businessId): int
    {
        return Appointment::where('business_id', $businessId)
            ->whereIn('status', [AppointmentStatus::Pending, AppointmentStatus::Confirmed])
            ->whereDate('date', Carbon::today())
            ->count();
    }

    public function getCompletedRevenue(int $businessId): float
    {
        return (float) Appointment::where('business_id', $businessId)
            ->where('status', AppointmentStatus::Confirmed)
            ->sum('price');
    }

    public function getCurrentMonthRevenue(int $businessId): float
    {
        return (float) Appointment::where('business_id', $businessId)
            ->where('status', AppointmentStatus::Confirmed)
            ->whereDate('date', Carbon::today())
            ->sum('price');
    }

    public function getRecent(int $businessId, int $limit = 10, ?string $date = null): Collection
    {
        $query = Appointment::with(['employee', 'service'])
            ->where('business_id', $businessId);

        if ($date !== null) {
            $query->whereDate('date', $date);
        }

        return $query->orderBy('date')->orderBy('start_time')->take($limit)->get();
    }

    public function getByEmployeeAndDate(int $employeeId, string $date, ?int $excludeAppointmentId = null): Collection
    {
        return Appointment::where('employee_id', $employeeId)
            ->whereDate('date', $date)
            ->where('status', '!=', AppointmentStatus::Cancelled)
            ->when($excludeAppointmentId, fn ($q) => $q->where('id', '!=', $excludeAppointmentId))
            ->get(['id', 'start_time', 'end_time']);
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

    public function countAll(): int
    {
        return Appointment::count();
    }

    public function countSince(Carbon $since): int
    {
        return Appointment::where('created_at', '>=', $since)->count();
    }
}
