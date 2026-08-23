<?php

namespace App\Http\Controllers\Api\V1\Employee;

use App\Http\Controllers\Controller;
use App\Http\Requests\Employee\UpdateScheduleOverrideRequest;
use App\Http\Requests\Employee\UpdateScheduleRequest;
use App\Services\Interfaces\ScheduleServiceInterface;
use App\Support\StaffBookingSlug;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class ScheduleController extends Controller
{
    public function __construct(
        private ScheduleServiceInterface $scheduleService,
    ) {}

    /** Date-range availability override view (a 7-day week snapped to Monday). */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $dateFrom = $this->resolveWeekStart($request->query('date_from'));
        $dateTo = Carbon::parse($dateFrom)->addDays(6)->toDateString();

        $days = $this->scheduleService->getDaysForRange($user, $dateFrom, $dateTo);
        $baseSchedules = $this->scheduleService->getSchedules($user)
            ->map(fn ($s) => [
                'day_of_week' => $s->day_of_week,
                'is_active' => $s->is_active,
                'start_time' => substr((string) $s->start_time, 0, 5),
                'end_time' => substr((string) $s->end_time, 0, 5),
                'breaks' => $s->breaks->map(fn ($b) => [
                    'start_time' => substr((string) $b->start_time, 0, 5),
                    'end_time' => substr((string) $b->end_time, 0, 5),
                ])->values()->all(),
            ])
            ->keyBy('day_of_week');

        return response()->json([
            'days' => $days,
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'baseSchedules' => $baseSchedules,
        ]);
    }

    /** Save date-specific availability overrides for a week. */
    public function saveOverrides(UpdateScheduleOverrideRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $this->scheduleService->saveOverrides($request->user(), Arr::only($validated, ['days']));

        return response()->json(['message' => __('messages.settings.saved')]);
    }

    /** Default (base) weekly schedule configuration. */
    public function configuration(Request $request): JsonResponse
    {
        $user = $request->user();
        $business = $user->business;
        $schedules = $this->scheduleService->getSchedules($user);

        $employeeSlug = $user->booking_slug ?: Str::slug($user->name);

        return response()->json([
            'schedules' => $schedules,
            'business_name' => $business?->name,
            'employee_email' => $user->email,
            'booking_url' => $business ? "/book/{$business->slug}" : null,
            'employee_booking_url' => $business ? "/book/{$business->slug}/{$employeeSlug}" : null,
            'booking_slug' => $employeeSlug,
            'business_slug' => $business?->slug,
        ]);
    }

    /** Save the base weekly schedule. */
    public function update(UpdateScheduleRequest $request): JsonResponse
    {
        $this->scheduleService->updateSchedules($request->user(), $request->validated());

        return response()->json(['message' => __('messages.settings.saved')]);
    }

    /** Save the employee's custom booking slug (Personal Booking URL). */
    public function updateInfo(Request $request): JsonResponse
    {
        $user = $request->user();

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
                    if (StaffBookingSlug::takenByOtherStaff((int) $user->business_id, (int) $user->id, (string) $value)) {
                        $fail(__('errors.schedule.booking_slug_taken'));
                    }
                },
            ],
        ]);

        $user->update(['booking_slug' => $slug]);

        return response()->json([
            'message' => __('messages.settings.saved'),
            'booking_slug' => $slug,
        ]);
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
