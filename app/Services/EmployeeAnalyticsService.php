<?php

namespace App\Services;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\User;
use App\Services\Interfaces\EmployeeAnalyticsServiceInterface;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class EmployeeAnalyticsService implements EmployeeAnalyticsServiceInterface
{
    public function getAnalyticsData(User $user, array $filters): array
    {
        $business = $user->business;
        abort_unless($business, 403);

        $serviceId = $this->normalizeServiceFilter($user, $filters['service_id'] ?? null);

        $appointments = Appointment::query()
            ->where('employee_id', $user->id)
            ->where('business_id', $business->id)
            ->whereDate('date', '>=', $filters['date_from'])
            ->whereDate('date', '<=', $filters['date_to'])
            ->when($serviceId !== null, fn ($q) => $q->where('service_id', $serviceId))
            ->with('service:id,name')
            ->get(['id', 'service_id', 'status', 'price', 'date']);

        $summary = $this->buildSummary($appointments);
        $serviceStats = $this->buildServiceStats($appointments);
        $monthlyPerformance = $this->buildMonthlyPerformance(
            $appointments,
            $filters['date_from'],
            $filters['date_to']
        );

        $CURRENCY_SYMBOLS = ['EUR' => '€', 'USD' => '$', 'GBP' => '£', 'CHF' => 'CHF'];
        $currencySymbol = $CURRENCY_SYMBOLS[$business->currency ?? ''] ?? $business->currency_symbol ?? '€';

        $servicesForFilter = $user->services()
            ->where('services.business_id', $business->id)
            ->where('services.is_active', true)
            ->orderBy('services.name')
            ->get(['services.id', 'services.name']);

        $selectedService = $serviceId !== null
            ? $servicesForFilter->firstWhere('id', $serviceId)
            : null;

        return [
            'filters' => [
                'date_from' => $filters['date_from'],
                'date_to' => $filters['date_to'],
                'service_id' => $serviceId,
            ],
            'currency_symbol' => $currencySymbol,
            'service_options' => $servicesForFilter->map(fn ($s) => ['id' => $s->id, 'name' => $s->name])->values(),
            'summary' => $summary,
            'service_stats' => $serviceStats,
            'monthly_performance' => $monthlyPerformance,
            'selected_service_name' => $selectedService?->name,
        ];
    }

    private function normalizeServiceFilter(User $user, mixed $raw): ?int
    {
        if ($raw === null || $raw === '') {
            return null;
        }

        if (! is_numeric($raw)) {
            return null;
        }

        $id = (int) $raw;
        if ($id <= 0) {
            return null;
        }

        if (! $user->services()->where('services.id', $id)->exists()) {
            return null;
        }

        return $id;
    }

    /**
     * @return array{total_appointments: int, confirmed_count: int, cancelled_count: int, pending_count: int, revenue: float}
     */
    private function buildSummary(Collection $appointments): array
    {
        return [
            'total_appointments' => $appointments->count(),
            'confirmed_count' => $appointments->where('status', AppointmentStatus::Confirmed)->count(),
            'cancelled_count' => $appointments->where('status', AppointmentStatus::Cancelled)->count(),
            'pending_count' => $appointments->where('status', AppointmentStatus::Pending)->count(),
            'revenue' => (float) $appointments->where('status', AppointmentStatus::Confirmed)->sum('price'),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function buildServiceStats(Collection $appointments): array
    {
        return $appointments->groupBy('service_id')->map(function (Collection $group) {
            $first = $group->first();
            $name = $first->service?->name ?? 'Unknown';
            $confirmed = $group->where('status', AppointmentStatus::Confirmed);
            $rev = (float) $confirmed->sum('price');
            $cc = $confirmed->count();

            return [
                'service_id' => $first->service_id,
                'service_name' => $name,
                'cancelled_count' => $group->where('status', AppointmentStatus::Cancelled)->count(),
                'pending_count' => $group->where('status', AppointmentStatus::Pending)->count(),
                'confirmed_count' => $cc,
                'revenue' => $rev,
            ];
        })->sortByDesc('revenue')->values()->all();
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
                'label' => $cursor->copy()->locale('en')->translatedFormat('F Y'),
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
