<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Business;
use App\Models\Service;
use App\Models\User;
use App\Support\AppointmentListScope;
use Illuminate\Http\Request;

/**
 * Filter/window resolution and calendar payload shared by the web (Inertia)
 * and API v1 admin appointment controllers. Requires
 * ResolvesAppointmentCalendarQuery for the base calendar helpers.
 */
trait ResolvesAdminAppointmentQuery
{
    /**
     * @return array{employee_id?: int, scope: string, date_from: ?string, date_to: ?string, statuses: list<string>, service_id?: int, search?: string}
     */
    private function adminAppointmentsFiltersFromRequest(Request $request): array
    {
        $filters = [];

        $employeeIdRaw = $request->query('employee_id');
        if ($employeeIdRaw !== null && $employeeIdRaw !== '' && is_numeric($employeeIdRaw)) {
            $id = (int) $employeeIdRaw;
            if ($id > 0) {
                $filters['employee_id'] = $id;
            }
        }

        $business = $request->user()?->panelBusiness();

        $filters = array_merge(
            $filters,
            AppointmentListScope::filtersFromRequest($request, $business),
        );

        $filters['statuses'] = $this->resolveStatusFilterStrings($request);

        if ($business) {
            $rawServiceId = $request->query('service_id');
            if ($rawServiceId !== null && $rawServiceId !== '') {
                $parsed = filter_var($rawServiceId, FILTER_VALIDATE_INT);
                if ($parsed !== false && $parsed > 0) {
                    $belongs = Service::query()
                        ->whereKey($parsed)
                        ->where('business_id', $business->id)
                        ->exists();
                    if ($belongs) {
                        $filters['service_id'] = (int) $parsed;
                    }
                }
            }
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

    /**
     * Calendar payload for the whole business (optionally filtered to one
     * employee), shared verbatim between the Inertia page and the API endpoint.
     *
     * @return array<string, mixed>
     */
    private function buildAdminCalendarData(Request $request, Business $business): array
    {
        $view = $this->resolveCalendarView($request);

        $anchorDate = $this->resolveCalendarAnchorDate($request);
        $calendarFilters = $this->calendarFiltersFromRequest($request, null, (int) $business->id);
        $data = $this->appointmentService->getCalendarView($business, $view, $anchorDate, $calendarFilters);

        $data['calendar_day_breaks'] = [];
        $data['calendar_day_offs'] = [];
        if (! empty($calendarFilters['employee_id'])) {
            $employee = User::query()
                ->where('business_id', $business->id)
                ->whereKey((int) $calendarFilters['employee_id'])
                ->first();
            if ($employee) {
                $data['calendar_day_breaks'] = $this->scheduleService->getBreakIntervalsKeyedByDate(
                    $employee,
                    $data['range_start'],
                    $data['range_end'],
                );
                $data['calendar_day_offs'] = $this->scheduleService->getDayOffDatesForRange(
                    $employee,
                    $data['range_start'],
                    $data['range_end'],
                );
            }
        } else {
            $data['calendar_day_breaks'] = $this->scheduleService->getMergedBreakIntervalsForBusiness(
                $business,
                $data['range_start'],
                $data['range_end'],
            );
        }

        $maps = $this->scheduleService->getCalendarBreakAndDayOffMapsForEmployees(
            $business,
            $data['range_start'],
            $data['range_end'],
        );
        $data['calendar_employee_day_breaks'] = $maps['breaks'];
        $data['calendar_employee_day_offs'] = $maps['day_offs'];

        $data['filters'] = [
            'employee_id' => $calendarFilters['employee_id'] ?? null,
            'status' => $calendarFilters['statuses'],
            'service_id' => $calendarFilters['service_id'] ?? null,
            'search' => $calendarFilters['search'] ?? null,
            'view' => $view,
            'date' => $anchorDate,
        ];

        return $data;
    }
}
