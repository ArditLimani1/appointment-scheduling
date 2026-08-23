<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Service;
use App\Models\User;
use App\Support\AppointmentListScope;
use Carbon\Carbon;
use Illuminate\Http\Request;

/**
 * Filter/window resolution shared by the web (Inertia) and API v1 employee
 * appointment controllers. Requires ResolvesAppointmentCalendarQuery for
 * resolveStatusFilterStrings().
 */
trait ResolvesEmployeeAppointmentQuery
{
    /**
     * @return array{employee_id: int, date_from: string, date_to: string, statuses: list<string>, service_id: int|null, search: string|null}
     */
    private function employeeAppointmentsFiltersFromRequest(Request $request, User $user): array
    {
        $business = $user->panelBusiness();
        abort_unless($business, 403);

        $scopeFilters = AppointmentListScope::filtersFromRequest($request, $business);
        $from = $scopeFilters['date_from'];
        $to = $scopeFilters['date_to'];

        if ($request->filled('date') && $from === null && $to === null) {
            $legacy = $this->parseAppointmentsListDate($request->input('date'));
            if ($legacy !== null) {
                $from = $legacy;
                $to = $legacy;
            }
        }

        $resolvedServiceId = null;
        $rawServiceId = $request->query('service_id');
        if ($rawServiceId !== null && $rawServiceId !== '') {
            $parsed = filter_var($rawServiceId, FILTER_VALIDATE_INT);
            if ($parsed !== false && $parsed > 0) {
                $belongs = Service::query()
                    ->whereKey($parsed)
                    ->where('business_id', $business->id)
                    ->exists();
                if ($belongs) {
                    $resolvedServiceId = (int) $parsed;
                }
            }
        }

        $search = $request->query('search');
        $search = is_string($search) ? trim($search) : '';
        if ($search !== '' && strlen($search) > 120) {
            $search = substr($search, 0, 120);
        }

        return array_merge($scopeFilters, [
            'employee_id' => (int) $user->id,
            'date_from' => $from,
            'date_to' => $to,
            'statuses' => $this->resolveStatusFilterStrings($request, ['pending', 'confirmed', 'cancelled']),
            'service_id' => $resolvedServiceId,
            'search' => $search !== '' ? $search : null,
        ]);
    }

    private function parseAppointmentsListDate(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $value = (string) $value;

        foreach (['Y-m-d', 'd.m.Y'] as $format) {
            try {
                return Carbon::createFromFormat($format, $value)->toDateString();
            } catch (\Throwable) {
            }
        }

        return null;
    }

    /**
     * Visible time span for the calendar grid: earliest start to latest end among active days in range.
     * Falls back to 08:00–20:00 when the employee has no active days in this period.
     */
    private function resolveCalendarHoursForEmployee(User $user, string $rangeStart, string $rangeEnd): array
    {
        $days = $this->scheduleService->getDaysForRange($user, $rangeStart, $rangeEnd);
        $active = array_values(array_filter($days, fn (array $d) => $d['is_active']));

        if ($active === []) {
            return ['start' => '08:00', 'end' => '20:00'];
        }

        $minStart = null;
        $maxEnd = null;

        foreach ($active as $d) {
            $s = Carbon::createFromFormat('H:i', $d['start_time'])->startOfMinute();
            $e = Carbon::createFromFormat('H:i', $d['end_time'])->startOfMinute();
            if ($minStart === null || $s->lt($minStart)) {
                $minStart = $s->copy();
            }
            if ($maxEnd === null || $e->gt($maxEnd)) {
                $maxEnd = $e->copy();
            }
        }

        if ($minStart === null || $maxEnd === null || ! $maxEnd->gt($minStart)) {
            return ['start' => '08:00', 'end' => '20:00'];
        }

        return [
            'start' => $minStart->format('H:i'),
            'end' => $maxEnd->format('H:i'),
        ];
    }

    /**
     * Calendar payload for the authenticated employee (own appointments only),
     * shared verbatim between the Inertia calendar page and the API endpoint.
     *
     * @return array<string, mixed>
     */
    private function buildEmployeeCalendarData(Request $request, User $user): array
    {
        $business = $user->panelBusiness();
        abort_unless($business, 403);

        $view = $this->resolveCalendarView($request);

        $anchorDate = $this->resolveCalendarAnchorDate($request);
        $calendarFilters = $this->calendarFiltersFromRequest(
            $request,
            (int) $user->id,
            (int) $business->id,
            ['pending', 'confirmed', 'cancelled'],
        );

        $data = $this->appointmentService->getCalendarView($business, $view, $anchorDate, $calendarFilters);

        $data['calendar_day_breaks'] = $this->scheduleService->getBreakIntervalsKeyedByDate(
            $user,
            $data['range_start'],
            $data['range_end'],
        );
        $data['calendar_day_offs'] = $this->scheduleService->getDayOffDatesForRange(
            $user,
            $data['range_start'],
            $data['range_end'],
        );

        $uid = (string) $user->id;
        $data['calendar_employee_day_breaks'] = [$uid => $data['calendar_day_breaks']];
        $data['calendar_employee_day_offs'] = [$uid => $data['calendar_day_offs']];

        $data['employees'] = $data['employees']->filter(fn ($e) => (int) $e['id'] === (int) $user->id)->values();

        $data['filters'] = [
            'employee_id' => (string) $user->id,
            'status' => $calendarFilters['statuses'],
            'service_id' => $calendarFilters['service_id'] ?? null,
            'search' => $calendarFilters['search'] ?? null,
            'view' => $view,
            'date' => $anchorDate,
        ];

        $data['employee_calendar'] = true;
        $data['calendar_hours'] = $this->resolveCalendarHoursForEmployee($user, $data['range_start'], $data['range_end']);

        return $data;
    }
}
