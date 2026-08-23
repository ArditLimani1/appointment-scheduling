<?php

namespace App\Http\Controllers\Concerns;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Month-defaulted date range + employee filter (id or legacy name), shared by
 * the web and API admin analytics controllers.
 */
trait ResolvesAdminAnalyticsFilters
{
    /**
     * @return array{date_from: string, date_to: string, employee_id?: int, legacy_employee_name?: string}
     */
    private function adminAnalyticsFiltersFromRequest(Request $request): array
    {
        $filters = [];

        $dateFrom = $request->query('date_from');
        if (is_string($dateFrom) && $dateFrom !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFrom)) {
            $filters['date_from'] = $dateFrom;
        } else {
            $filters['date_from'] = Carbon::now()->startOfMonth()->toDateString();
        }

        $dateTo = $request->query('date_to');
        if (is_string($dateTo) && $dateTo !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateTo)) {
            $filters['date_to'] = $dateTo;
        } else {
            $filters['date_to'] = Carbon::now()->endOfMonth()->toDateString();
        }

        if ($filters['date_from'] > $filters['date_to']) {
            [$filters['date_from'], $filters['date_to']] = [$filters['date_to'], $filters['date_from']];
        }

        $employeeFromQueryParsed = false;
        $employeeRaw = $request->query('employee');
        if (is_string($employeeRaw) && $employeeRaw !== '') {
            $employeeFromQueryParsed = true;
            if (str_starts_with($employeeRaw, 'legacy:')) {
                $decoded = rawurldecode(Str::after($employeeRaw, 'legacy:'));
                if ($decoded !== '') {
                    $filters['legacy_employee_name'] = $decoded;
                }
            } elseif (ctype_digit($employeeRaw)) {
                $id = (int) $employeeRaw;
                if ($id > 0) {
                    $filters['employee_id'] = $id;
                }
            }
        }

        $employeeIdRaw = $request->query('employee_id');
        if (! $employeeFromQueryParsed && $employeeIdRaw !== null && $employeeIdRaw !== '' && is_numeric($employeeIdRaw)) {
            $id = (int) $employeeIdRaw;
            if ($id > 0) {
                $filters['employee_id'] = $id;
            }
        }

        return $filters;
    }
}
