<?php

namespace App\Http\Controllers\Concerns;

use Carbon\Carbon;
use Illuminate\Http\Request;

/**
 * Month-defaulted date range + service filter, shared by the web and API
 * analytics controllers (admin and employee).
 */
trait ResolvesAnalyticsDateFilters
{
    /**
     * @return array{date_from: string, date_to: string, service_id: mixed}
     */
    private function analyticsFiltersFromRequest(Request $request): array
    {
        $dateFrom = $request->query('date_from');
        if (! is_string($dateFrom) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFrom)) {
            $dateFrom = Carbon::now()->startOfMonth()->toDateString();
        }

        $dateTo = $request->query('date_to');
        if (! is_string($dateTo) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateTo)) {
            $dateTo = Carbon::now()->endOfMonth()->toDateString();
        }

        if ($dateFrom > $dateTo) {
            [$dateFrom, $dateTo] = [$dateTo, $dateFrom];
        }

        return [
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'service_id' => $request->query('service_id'),
        ];
    }
}
