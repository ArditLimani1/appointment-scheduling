<?php

namespace App\Services;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Business;
use App\Repositories\Interfaces\EmployeeRepositoryInterface;
use App\Services\Interfaces\AnalyticsServiceInterface;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class AnalyticsService implements AnalyticsServiceInterface
{
    public function __construct(
        private EmployeeRepositoryInterface $employeeRepository,
    ) {}

    public function getAnalyticsData(Business $business, array $filters): array
    {
        $dateFrom = $filters['date_from'] ?? null;
        $dateTo = $filters['date_to'] ?? null;

        $legacyNamesForFilter = ($dateFrom && $dateTo)
            ? $this->legacySnapshotNamesInRange($business, $dateFrom, $dateTo)
            : collect();

        $employeeFilterOptions = $this->buildEmployeeFilterOptions($business, $legacyNamesForFilter);

        $appointments = Appointment::where('business_id', $business->id)
            ->when(! empty($filters['date_from']), fn ($q) => $q->whereDate('date', '>=', $filters['date_from']))
            ->when(! empty($filters['date_to']), fn ($q) => $q->whereDate('date', '<=', $filters['date_to']))
            ->when(
                ! empty($filters['legacy_employee_name']),
                fn ($q) => $q->whereNull('employee_id')
                    ->where('employee_name', $filters['legacy_employee_name'])
            )
            ->when(
                empty($filters['legacy_employee_name']) && ! empty($filters['employee_id']),
                fn ($q) => $q->where('employee_id', (int) $filters['employee_id'])
            )
            ->with('employee:id,name')
            ->get(['employee_id', 'employee_name', 'status', 'price', 'date']);

        $monthlyPerformance = $this->buildMonthlyPerformance(
            $appointments,
            $filters['date_from'],
            $filters['date_to']
        );

        $totalAppointments = $appointments->count();
        $confirmedCount = $appointments->where('status', AppointmentStatus::Confirmed)->count();
        $cancelledCount = $appointments->where('status', AppointmentStatus::Cancelled)->count();
        $pendingCount = $appointments->where('status', AppointmentStatus::Pending)->count();
        $totalRevenue = $appointments->where('status', AppointmentStatus::Confirmed)->sum('price');

        $groupedByEmployee = $appointments->groupBy(function (Appointment $apt) {
            return $apt->employee_id !== null
                ? 'id:'.$apt->employee_id
                : 'name:'.($apt->employee_name ?? '');
        });

        $employeeStats = $groupedByEmployee
            ->map(function ($group) {
                $firstRecord = $group->first();

                return [
                    'name' => $firstRecord->resolvedEmployeeName() ?? 'Unknown',
                    'cancelled_count' => $group->where('status', AppointmentStatus::Cancelled)->count(),
                    'pending_count' => $group->where('status', AppointmentStatus::Pending)->count(),
                    'confirmed_count' => $group->where('status', AppointmentStatus::Confirmed)->count(),
                    'revenue' => (float) $group->where('status', AppointmentStatus::Confirmed)->sum('price'),
                ];
            })
            ->sortByDesc('confirmed_count')
            ->values();

        $CURRENCY_SYMBOLS = ['EUR' => '€', 'USD' => '$', 'GBP' => '£', 'CHF' => 'CHF'];
        $currencySymbol = $CURRENCY_SYMBOLS[$business->currency ?? ''] ?? $business->currency_symbol ?? '€';

        $filtersForFront = [
            'date_from' => $filters['date_from'] ?? null,
            'date_to' => $filters['date_to'] ?? null,
            'employee' => $this->encodeEmployeeFilterValue($filters),
        ];

        return [
            'total_appointments' => $totalAppointments,
            'confirmed_count' => $confirmedCount,
            'cancelled_count' => $cancelledCount,
            'pending_count' => $pendingCount,
            'total_revenue' => (float) $totalRevenue,
            'employee_stats' => $employeeStats,
            'monthly_performance' => $monthlyPerformance,
            'employee_filter_options' => $employeeFilterOptions,
            'filters' => $filtersForFront,
            'currency_symbol' => $currencySymbol,
        ];
    }

    /**
     * Distinct snapshot names for appointments with no employee link, in the date range (for filter dropdown).
     *
     * @return Collection<int, string>
     */
    private function legacySnapshotNamesInRange(Business $business, string $dateFrom, string $dateTo): Collection
    {
        return Appointment::query()
            ->where('business_id', $business->id)
            ->whereDate('date', '>=', $dateFrom)
            ->whereDate('date', '<=', $dateTo)
            ->whereNull('employee_id')
            ->whereNotNull('employee_name')
            ->where('employee_name', '!=', '')
            ->distinct()
            ->orderBy('employee_name')
            ->pluck('employee_name');
    }

    /**
     * @param  Collection<int, string>  $legacyNames
     * @return list<array{value: string, label: string}>
     */
    private function buildEmployeeFilterOptions(Business $business, Collection $legacyNames): array
    {
        $options = [
            ['value' => '', 'label' => __('admin.analytics.all_employees')],
        ];

        $staff = $this->employeeRepository->getByBusiness($business->id)->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE);
        foreach ($staff as $e) {
            $options[] = ['value' => (string) $e->id, 'label' => $e->name];
        }

        foreach ($legacyNames as $name) {
            $options[] = [
                'value' => 'legacy:'.rawurlencode($name),
                'label' => $name.' '.__('admin.analytics.filter_former_staff_suffix'),
            ];
        }

        return $options;
    }

    /**
     * @param  array{employee_id?: int, legacy_employee_name?: string, ...}  $filters
     */
    private function encodeEmployeeFilterValue(array $filters): string
    {
        if (! empty($filters['legacy_employee_name']) && is_string($filters['legacy_employee_name'])) {
            return 'legacy:'.rawurlencode($filters['legacy_employee_name']);
        }

        if (! empty($filters['employee_id'])) {
            return (string) (int) $filters['employee_id'];
        }

        return '';
    }

    /**
     * @return list<array{month: string, label: string, confirmed: int, cancelled: int, pending: int, revenue: float}>
     */
    private function buildMonthlyPerformance(Collection $appointments, string $from, string $to): array
    {
        $months = [];
        $cursor = Carbon::parse($from)->startOfMonth();
        $endMonth = Carbon::parse($to)->startOfMonth();

        while ($cursor->lte($endMonth)) {
            $key = $cursor->format('Y-m');
            $months[$key] = [
                'month' => $key,
                'label' => Str::ucfirst($cursor->copy()->locale(app()->getLocale())->translatedFormat('F Y')),
                'confirmed' => 0,
                'cancelled' => 0,
                'pending' => 0,
                'revenue' => 0.0,
            ];
            $cursor->addMonth();
        }

        foreach ($appointments as $apt) {
            $key = $apt->date->format('Y-m');
            if (! isset($months[$key])) {
                continue;
            }

            match ($apt->status) {
                AppointmentStatus::Confirmed => $months[$key]['confirmed']++,
                AppointmentStatus::Cancelled => $months[$key]['cancelled']++,
                AppointmentStatus::Pending => $months[$key]['pending']++,
            };

            if ($apt->status === AppointmentStatus::Confirmed) {
                $months[$key]['revenue'] += (float) $apt->price;
            }
        }

        return array_values($months);
    }
}
