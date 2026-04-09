<?php

namespace App\Http\Controllers\Concerns;

use Carbon\Carbon;
use Illuminate\Http\Request;

trait ResolvesAppointmentCalendarQuery
{
    /**
     * Anchor date for calendar (Y-m-d). Supports legacy `week` query for bookmarks.
     */
    private function resolveCalendarAnchorDate(Request $request): string
    {
        $raw = $request->query('date');
        if (! is_string($raw) || $raw === '' || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $raw)) {
            $raw = $request->query('week');
        }
        if (is_string($raw) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $raw)) {
            return Carbon::parse($raw)->toDateString();
        }

        return Carbon::now()->toDateString();
    }

    /**
     * Multi-select status query (`status[]=pending&status[]=confirmed`). Single `status=` or comma list still accepted.
     * Default when absent or empty: pending + confirmed.
     *
     * @return list<string>
     */
    private function resolveStatusFilterStrings(Request $request): array
    {
        $allowed = ['pending', 'confirmed', 'cancelled'];
        $raw = $request->query('status');
        $values = [];

        if (is_array($raw)) {
            foreach ($raw as $v) {
                if (is_string($v) && in_array($v, $allowed, true)) {
                    $values[] = $v;
                }
            }
        } elseif (is_string($raw) && $raw !== '') {
            foreach (array_map('trim', explode(',', $raw)) as $part) {
                if (in_array($part, $allowed, true)) {
                    $values[] = $part;
                }
            }
        }

        $values = array_values(array_unique($values));

        if ($values === []) {
            return ['pending', 'confirmed'];
        }

        return $values;
    }

    /**
     * @return array{employee_id?: int, statuses: list<string>}
     */
    private function calendarFiltersFromRequest(Request $request, ?int $lockedEmployeeId = null): array
    {
        $filters = [
            'statuses' => $this->resolveStatusFilterStrings($request),
        ];

        if ($lockedEmployeeId !== null) {
            $filters['employee_id'] = $lockedEmployeeId;

            return $filters;
        }

        $employeeIdRaw = $request->query('employee_id');
        if ($employeeIdRaw !== null && $employeeIdRaw !== '' && is_numeric($employeeIdRaw)) {
            $id = (int) $employeeIdRaw;
            if ($id > 0) {
                $filters['employee_id'] = $id;
            }
        }

        return $filters;
    }
}
