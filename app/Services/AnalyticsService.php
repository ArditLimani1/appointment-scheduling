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
            ->with('employee:id,name')
            ->get(['employee_id', 'status', 'price']);

        $totalAppointments = $appointments->count();
        $totalRevenue = $appointments->where('status', AppointmentStatus::Confirmed)->sum('price');

        $groupedByEmployee = $appointments->groupBy('employee_id');

        $employeeStats = $groupedByEmployee
            ->map(function ($group) {
                $firstRecord = $group->first();

                return [
                    'name'              => $firstRecord->employee?->name ?? 'Unknown',
                    'cancelled_count'   => $group->where('status', AppointmentStatus::Cancelled)->count(),
                    'pending_count'     => $group->where('status', AppointmentStatus::Pending)->count(),
                    'confirmed_count'   => $group->where('status', AppointmentStatus::Confirmed)->count(),
                    'revenue'           => (float) $group->where('status', AppointmentStatus::Confirmed)->sum('price'),
                ];
            })
            ->sortByDesc('confirmed_count')
            ->values();

        $employees = $this->employeeRepository->getByBusiness($business->id);

        $CURRENCY_SYMBOLS = ['EUR' => '€', 'USD' => '$', 'GBP' => '£', 'CHF' => 'CHF'];
        $currencySymbol = $CURRENCY_SYMBOLS[$business->currency ?? ''] ?? $business->currency_symbol ?? '€';

        return [
            'total_appointments' => $totalAppointments,
            'total_revenue'      => (float) $totalRevenue,
            'employee_stats'     => $employeeStats,
            'employees'          => $employees->map(fn ($e) => ['id' => $e->id, 'name' => $e->name]),
            'filters'            => $filters,
            'currency_symbol'    => $currencySymbol,
        ];
    }
}
