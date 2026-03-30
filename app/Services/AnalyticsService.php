<?php

namespace App\Services;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Business;
use App\Repositories\Interfaces\EmployeeRepositoryInterface;
use App\Services\Interfaces\AnalyticsServiceInterface;

class AnalyticsService implements AnalyticsServiceInterface
{
    public function __construct(
        private EmployeeRepositoryInterface $employeeRepository,
    ) {}

    public function getAnalyticsData(Business $business, array $filters): array
    {
        $appointments = Appointment::where('business_id', $business->id)
            ->when(! empty($filters['date_from']), fn ($q) => $q->whereDate('date', '>=', $filters['date_from']))
            ->when(! empty($filters['date_to']), fn ($q) => $q->whereDate('date', '<=', $filters['date_to']))
            ->when(! empty($filters['employee_id']), fn ($q) => $q->where('employee_id', (int) $filters['employee_id']))
            ->with('employee:id,name,title')
            ->get(['employee_id', 'status', 'price']);

        $totalAppointments = $appointments->count();
        $totalRevenue = $appointments->where('status', AppointmentStatus::Completed)->sum('price');

        $groupedByEmployee = $appointments->groupBy('employee_id');
        $maxAppointmentCount = $groupedByEmployee->map->count()->max() ?: 1;

        $employeeStats = $groupedByEmployee
            ->map(function ($group) use ($maxAppointmentCount) {
                $firstRecord = $group->first();
                $appointmentCount = $group->count();
                $revenue = $group->where('status', AppointmentStatus::Completed)->sum('price');

                return [
                    'name' => $firstRecord->employee?->name ?? 'Unknown',
                    'title' => $firstRecord->employee?->title ?? '',
                    'appointment_count' => $appointmentCount,
                    'revenue' => (float) $revenue,
                    'performance_pct' => (int) round(($appointmentCount / $maxAppointmentCount) * 100),
                ];
            })
            ->sortByDesc('appointment_count')
            ->values();

        $employees = $this->employeeRepository->getByBusiness($business->id);

        return [
            'total_appointments' => $totalAppointments,
            'total_revenue' => (float) $totalRevenue,
            'employee_stats' => $employeeStats,
            'employees' => $employees->map(fn ($employee) => ['id' => $employee->id, 'name' => $employee->name]),
            'filters' => $filters,
            'currency_symbol' => $business->currency_symbol ?? '€',
        ];
    }
}
