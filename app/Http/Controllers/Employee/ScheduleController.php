<?php

namespace App\Http\Controllers\Employee;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Employee\UpdateScheduleOverrideRequest;
use App\Http\Requests\Employee\UpdateScheduleRequest;
use App\Models\User;
use App\Services\Interfaces\ScheduleServiceInterface;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
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
        $validated = $request->validated();
        $context = $validated['success_context'];

        $this->scheduleService->saveOverrides(auth()->user(), Arr::only($validated, ['days']));

        $message = match ($context) {
            'day_on' => __('messages.schedule.day_on'),
            'day_off' => __('messages.schedule.day_off'),
            'break_added' => __('messages.schedule.break_added'),
            'break_updated' => __('messages.schedule.break_updated'),
            'break_removed' => __('messages.schedule.break_removed'),
            'day_time_updated' => __('messages.schedule.day_time_updated'),
        };

        return redirect()->back()
            ->with('success', $message)
            ->with('flash_nonce', uniqid('', true));
    }

    /**
     * Default (base) weekly schedule configuration.
     */
    public function configuration(): Response
    {
        $user     = auth()->user();
        $business = $user->business;
        $schedules = $this->scheduleService->getSchedules($user);

        $employeeSlug       = $user->booking_slug ?: Str::slug($user->name);
        $bookingUrl         = $business ? "/book/{$business->slug}" : null;
        $employeeBookingUrl = $business ? "/book/{$business->slug}/{$employeeSlug}" : null;

        return Inertia::render('Employee/Schedule/Configuration', [
            'schedules'            => $schedules,
            'business_name'        => $business?->name,
            'employee_email'       => $user->email,
            'booking_url'          => $bookingUrl,
            'employee_booking_url' => $employeeBookingUrl,
            'booking_slug'         => $employeeSlug,
            'business_slug'        => $business?->slug,
        ]);
    }

    /**
     * Save the employee's custom booking slug (Personal Booking URL).
     */
    public function updateInfo(Request $request): RedirectResponse
    {
        $user = auth()->user();

        $slug = strtolower(trim((string) $request->input('booking_slug', '')));
        $request->merge(['booking_slug' => $slug]);

        $request->validate([
            'booking_slug' => [
                'required',
                'string',
                'max:100',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                function (string $attribute, mixed $value, \Closure $fail) use ($user) {
                    if (! $user->business_id) {
                        return;
                    }
                    if ($this->bookingSlugTakenByOtherStaff((int) $user->business_id, (int) $user->id, (string) $value)) {
                        $fail(__('errors.schedule.booking_slug_taken'));
                    }
                },
            ],
        ]);

        $user->update(['booking_slug' => $request->validated('booking_slug')]);

        return redirect()->back()
            ->with('success', __('messages.settings.saved'))
            ->with('flash_nonce', uniqid('', true));
    }

    /**
     * Whether another active bookable staff member in the business already uses this URL slug.
     */
    private function bookingSlugTakenByOtherStaff(int $businessId, int $excludeUserId, string $slug): bool
    {
        $others = User::query()
            ->where('business_id', $businessId)
            ->where('id', '!=', $excludeUserId)
            ->where('is_active', true)
            ->where(function ($q) {
                $q->where('role', UserRole::Employee)
                    ->orWhere(function ($q2) {
                        $q2->where('role', UserRole::Admin)
                            ->where('also_works_as_staff', true);
                    });
            })
            ->get(['id', 'name', 'booking_slug']);

        return $others->contains(function (User $other) use ($slug) {
            $effective = $other->booking_slug ?: Str::slug($other->name);

            return $effective === $slug;
        });
    }

    /**
     * Save the base weekly schedule.
     */
    public function update(UpdateScheduleRequest $request): RedirectResponse
    {
        $this->scheduleService->updateSchedules(auth()->user(), $request->validated());

        return redirect()->back()
            ->with('success', __('messages.settings.saved'))
            ->with('flash_nonce', uniqid('', true));
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
