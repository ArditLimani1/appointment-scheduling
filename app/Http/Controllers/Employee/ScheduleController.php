<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Http\Requests\Employee\UpdateScheduleOverrideRequest;
use App\Http\Requests\Employee\UpdateScheduleRequest;
use App\Services\Interfaces\ScheduleServiceInterface;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    public function __construct(
        private ScheduleServiceInterface $scheduleService,
    ) {}

    /**
     * Date-range availability override view.
     * Shows a 7-day week (defaulting to current week) pre-filled from overrides
     * or the base schedule, ready for date-specific customisation.
     */
    public function index(Request $request): Response
    {
        $user     = auth()->user();
        $dateFrom = $this->resolveWeekStart($request->query('date_from'));
        $dateTo   = Carbon::parse($dateFrom)->addDays(6)->toDateString();

        $days          = $this->scheduleService->getDaysForRange($user, $dateFrom, $dateTo);
        $baseSchedules = $this->scheduleService->getSchedules($user)
            ->map(fn ($s) => [
                'day_of_week' => $s->day_of_week,
                'is_active'   => $s->is_active,
                'start_time'  => substr((string) $s->start_time, 0, 5),
                'end_time'    => substr((string) $s->end_time, 0, 5),
                'breaks'      => $s->breaks->map(fn ($b) => [
                    'start_time' => substr((string) $b->start_time, 0, 5),
                    'end_time'   => substr((string) $b->end_time, 0, 5),
                ])->values()->all(),
            ])
            ->keyBy('day_of_week');

        return Inertia::render('Employee/Schedule/Index', [
            'days'          => $days,
            'dateFrom'      => $dateFrom,
            'dateTo'        => $dateTo,
            'baseSchedules' => $baseSchedules,
        ]);
    }

    /**
     * Save date-specific availability overrides for a week.
     */
    public function saveOverrides(UpdateScheduleOverrideRequest $request): RedirectResponse
    {
        $this->scheduleService->saveOverrides(auth()->user(), $request->validated());

        return redirect()->back()->with('success', 'Availability updated successfully.');
    }

    /**
     * Default (base) weekly schedule configuration.
     */
    public function configuration(): Response
    {
        $user     = auth()->user();
        $business = $user->business;
        $schedules = $this->scheduleService->getSchedules($user);

        $employeeSlug       = Str::slug($user->name);
        $bookingUrl         = $business ? "/book/{$business->slug}" : null;
        $employeeBookingUrl = $business ? "/book/{$business->slug}/{$employeeSlug}" : null;

        return Inertia::render('Employee/Schedule/Configuration', [
            'schedules'            => $schedules,
            'business_name'        => $business?->name,
            'employee_email'       => $user->email,
            'booking_url'          => $bookingUrl,
            'employee_booking_url' => $employeeBookingUrl,
        ]);
    }

    /**
     * Save the base weekly schedule.
     */
    public function update(UpdateScheduleRequest $request): RedirectResponse
    {
        $this->scheduleService->updateSchedules(auth()->user(), $request->validated());

        return redirect()->back()->with('success', 'Default schedule updated successfully.');
    }

    private function resolveWeekStart(?string $dateFrom): string
    {
        if ($dateFrom && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFrom)) {
            // Always snap to the Monday of whatever date was supplied
            return Carbon::parse($dateFrom)->startOfWeek(Carbon::MONDAY)->toDateString();
        }

        return Carbon::now()->startOfWeek(Carbon::MONDAY)->toDateString();
    }
}
