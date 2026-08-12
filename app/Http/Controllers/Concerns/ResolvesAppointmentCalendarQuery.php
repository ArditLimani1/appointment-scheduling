<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Service;
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
     * Default when absent or empty: pending + confirmed (or $defaultWhenEmpty).
     *
     * @param  list<string>|null  $defaultWhenEmpty
     * @return list<string>
     */
    private function resolveStatusFilterStrings(Request $request, ?array $defaultWhenEmpty = null): array
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
            return $defaultWhenEmpty ?? ['pending', 'confirmed'];
        }

        return $values;
    }

    /**
     * @param  list<string>|null  $defaultStatuses
     * @return array{employee_id?: int, statuses: list<string>, service_id?: int, search?: string}
     */
    private function calendarFiltersFromRequest(
        Request $request,
        ?int $lockedEmployeeId = null,
        ?int $businessIdForServiceFilter = null,
        ?array $defaultStatuses = null,
    ): array {
        $filters = [
            'statuses' => $this->resolveStatusFilterStrings($request, $defaultStatuses),
        ];

        if ($lockedEmployeeId !== null) {
            $filters['employee_id'] = $lockedEmployeeId;
        } else {
            $employeeIdRaw = $request->query('employee_id');
            if ($employeeIdRaw !== null && $employeeIdRaw !== '' && is_numeric($employeeIdRaw)) {
                $id = (int) $employeeIdRaw;
                if ($id > 0) {
                    $filters['employee_id'] = $id;
                }
            }
        }

        $serviceId = $this->resolveCalendarServiceIdFromRequest($request, $businessIdForServiceFilter);
        if ($serviceId !== null) {
            $filters['service_id'] = $serviceId;
        }

        $search = $request->query('search');
        $search = is_string($search) ? trim($search) : '';
        if ($search !== '' && strlen($search) > 120) {
            $search = substr($search, 0, 120);
        }
        if ($search !== '') {
            $filters['search'] = $search;
        }

        return $filters;
    }

    private function resolveCalendarServiceIdFromRequest(Request $request, ?int $businessId): ?int
    {
        if ($businessId === null || $businessId <= 0) {
            return null;
        }

        $rawServiceId = $request->query('service_id');
        if ($rawServiceId === null || $rawServiceId === '') {
            return null;
        }

        $parsed = filter_var($rawServiceId, FILTER_VALIDATE_INT);
        if ($parsed === false || $parsed <= 0) {
            return null;
        }

        $belongs = Service::query()
            ->whereKey($parsed)
            ->where('business_id', $businessId)
            ->exists();

        return $belongs ? (int) $parsed : null;
    }
}
