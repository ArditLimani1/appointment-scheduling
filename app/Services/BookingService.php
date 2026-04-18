<?php

namespace App\Services;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Business;
use App\Models\Service;
use App\Models\SharedResource;
use App\Repositories\Interfaces\AppointmentRepositoryInterface;
use App\Repositories\Interfaces\BusinessRepositoryInterface;
use App\Repositories\Interfaces\EmployeeRepositoryInterface;
use App\Repositories\Interfaces\ScheduleOverrideRepositoryInterface;
use App\Repositories\Interfaces\ScheduleRepositoryInterface;
use App\Repositories\Interfaces\ServiceRepositoryInterface;
use App\Services\Interfaces\BookingServiceInterface;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BookingService implements BookingServiceInterface
{
    public function __construct(
        private BusinessRepositoryInterface $businessRepository,
        private EmployeeRepositoryInterface $employeeRepository,
        private ServiceRepositoryInterface $serviceRepository,
        private ScheduleRepositoryInterface $scheduleRepository,
        private ScheduleOverrideRepositoryInterface $scheduleOverrideRepository,
        private AppointmentRepositoryInterface $appointmentRepository,
        private SharedResourceUsageService $sharedResourceUsageService,
    ) {}

    public function getBookingPageData(string $slug, ?string $employeeSlug = null): array
    {
        $business = $this->businessRepository->findActiveBySlug($slug);

        $employees = $this->employeeRepository->getActiveByBusiness($business->id, [
            'services' => fn ($query) => $query->where('is_active', true),
            'schedules',
        ]);

        $preselectedEmployeeId = null;
        if ($employeeSlug) {
            $match = $employees->first(
                fn ($e) => ($e->booking_slug ?: Str::slug($e->name)) === $employeeSlug
            );
            $preselectedEmployeeId = $match?->id;
        }

        $services = $employeeSlug && $preselectedEmployeeId
            ? $this->serviceRepository->getActiveByBusiness($business->id)
                ->filter(fn ($svc) => $employees
                    ->firstWhere('id', $preselectedEmployeeId)
                    ?->services->contains('id', $svc->id)
                )->values()
            : $this->serviceRepository->getActiveByBusiness($business->id);

        $timezone = $business->timezone ?: config('app.timezone');
        $today = Carbon::now($timezone)->toDateString();
        $maxBookable = Carbon::now($timezone)->startOfDay()
            ->addDays((int) ($business->max_booking_window ?? 30))
            ->toDateString();

        return [
            'business' => $business,
            'employees' => $employees,
            'services' => $services,
            'slug' => $slug,
            'preselected_employee_id' => $preselectedEmployeeId,
            'booking_today' => $today,
            'booking_max_date' => $maxBookable,
        ];
    }

    public function getAvailableSlots(string $slug, array $data): array
    {
        $business = $this->businessRepository->findActiveBySlug($slug);
        $timezone = $business->timezone ?: config('app.timezone');
        $date = Carbon::parse($data['date'], $timezone)->startOfDay();

        $maxDate = Carbon::now($timezone)->startOfDay()->addDays($business->max_booking_window ?? 30);
        if ($date->gt($maxDate)) {
            return [];
        }

        $minNoticeTime = Carbon::now($timezone)->addMinutes($business->min_booking_notice ?? 60);

        $employeeId = (int) $data['employee_id'];
        abort_if(
            ! $this->employeeRepository->getActiveByBusiness($business->id)->contains('id', $employeeId),
            422,
            'The selected employee is not available for this business.'
        );

        $schedule = $this->resolveEffectiveSchedule($employeeId, $date);
        if (! $schedule) {
            return [];
        }

        $slotDuration = $this->resolveSlotDurationMinutes($business, $data);
        $businessSlot = (int) ($business->slot_duration ?? 30);
        $stepMinutes = $this->resolveStepMinutesForSlotBlock($businessSlot, $slotDuration);

        $existingAppointments = $this->appointmentRepository->getByEmployeeAndDate(
            $employeeId,
            $date->toDateString()
        );

        $slots = $this->calculateSlots(
            $date,
            $schedule,
            $slotDuration,
            $stepMinutes,
            $minNoticeTime,
            $existingAppointments,
            $timezone
        );

        $ids = array_values(array_unique(array_map('intval', $data['service_ids'] ?? [])));
        if ($ids === []) {
            return $slots;
        }

        return $this->filterSlotTimesForSharedResources(
            $business,
            $date->toDateString(),
            $slots,
            $ids,
            $timezone,
            null
        );
    }

    public function createBooking(string $slug, array $data): Collection
    {
        $business = $this->businessRepository->findActiveBySlug($slug);

        $employeeId = (int) $data['employee_id'];
        abort_if(
            ! $this->employeeRepository->getActiveByBusiness($business->id)->contains('id', $employeeId),
            422,
            'The selected employee is not available for this business.'
        );

        $ids = array_values(array_unique(array_map('intval', $data['service_ids'])));
        abort_if(count($ids) === 0, 422, 'Select at least one service.');

        $services = collect();
        foreach ($ids as $serviceId) {
            $service = $this->serviceRepository->findById($serviceId);
            abort_if(
                ! $service || $service->business_id !== $business->id,
                422,
                'The selected service is not available for this business.'
            );
            $service->loadMissing('sharedResources');
            $services->push($service);
        }

        $timezone = $business->timezone ?: config('app.timezone');
        $startTime = Carbon::parse($data['date'].' '.$data['start_time'], $timezone);
        $totalMinutes = (int) $services->sum('duration');
        $blockEnd = $startTime->copy()->addMinutes($totalMinutes);

        $this->assertTimeBlockIsBookable(
            $business,
            $employeeId,
            $data['date'],
            $startTime,
            $blockEnd,
            $timezone
        );

        $bookingReference = Str::uuid()->toString();

        return DB::transaction(function () use ($business, $employeeId, $data, $services, $timezone, $bookingReference) {
            $segments = $this->buildOrderedServiceSegments(
                $business,
                $services,
                $data['date'],
                $data['start_time'],
                $timezone
            );

            $resourceIds = $this->collectResourceIdsFromSegments($segments);
            if ($resourceIds !== []) {
                SharedResource::query()
                    ->whereIn('id', $resourceIds)
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get();
            }

            $created = collect();
            $cursor = Carbon::parse($data['date'].' '.$data['start_time'], $timezone);

            foreach ($services as $service) {
                $segmentEnd = $cursor->copy()->addMinutes($service->duration);
                $segment = [
                    'start' => $cursor->copy(),
                    'end' => $segmentEnd->copy(),
                    'service' => $service,
                ];
                $this->assertSegmentResourcesAvailable(
                    $business,
                    $data['date'],
                    $segment,
                    null,
                    $timezone
                );
                $appointment = $this->appointmentRepository->create([
                    'booking_reference' => $bookingReference,
                    'business_id' => $business->id,
                    'employee_id' => $employeeId,
                    'service_id' => $service->id,
                    'client_first_name' => $data['client_first_name'],
                    'client_last_name' => $data['client_last_name'],
                    'client_phone' => $data['client_phone'] ?? null,
                    'client_email' => $data['client_email'] ?? null,
                    'client_notes' => $data['client_notes'] ?? null,
                    'date' => $data['date'],
                    'start_time' => $cursor->format('H:i'),
                    'end_time' => $segmentEnd->format('H:i'),
                    'price' => $service->price,
                    'status' => AppointmentStatus::Pending,
                ]);
                $this->syncAppointmentSharedResources($appointment, $service);
                $created->push($appointment);
                $cursor = $segmentEnd;
            }

            return $created;
        });
    }

    public function getAdminAvailableSlots(Business $business, array $data): array
    {
        $timezone = $business->timezone ?: config('app.timezone');
        $date = Carbon::parse($data['date'], $timezone)->startOfDay();
        $employeeId = (int) $data['employee_id'];

        $schedule = $this->resolveEffectiveSchedule($employeeId, $date);
        if (! $schedule) {
            return [];
        }

        $businessSlot = (int) ($business->slot_duration ?? 30);
        $blockMinutes = $businessSlot;
        if (! empty($data['service_id'])) {
            $service = $this->serviceRepository->findById((int) $data['service_id']);
            if ($service && $service->business_id === $business->id) {
                $blockMinutes = (int) $service->duration;
            }
        }
        $stepMinutes = $this->resolveStepMinutesForSlotBlock($businessSlot, $blockMinutes);

        $excludeId = isset($data['exclude_id']) ? (int) $data['exclude_id'] : null;
        $existingAppointments = $this->appointmentRepository->getByEmployeeAndDate(
            $employeeId,
            $date->toDateString(),
            $excludeId
        );

        // Admin bypasses min-notice: use a past timestamp so all slots are eligible
        $minNoticeTime = Carbon::createFromTimestamp(0);

        $slots = $this->calculateSlots(
            $date,
            $schedule,
            $blockMinutes,
            $stepMinutes,
            $minNoticeTime,
            $existingAppointments,
            $timezone
        );

        if (empty($data['service_id'])) {
            return $slots;
        }

        $service = $this->serviceRepository->findById((int) $data['service_id']);
        if (! $service || $service->business_id !== $business->id) {
            return $slots;
        }

        $service->loadMissing('sharedResources');
        if ($service->sharedResources->isEmpty()) {
            return $slots;
        }

        $excludeId = isset($data['exclude_id']) ? (int) $data['exclude_id'] : null;

        return $this->filterSlotTimesForSharedResources(
            $business,
            $date->toDateString(),
            $slots,
            [$service->id],
            $timezone,
            $excludeId
        );
    }

    public function getConfirmation(Appointment $appointment): array
    {
        $appointment->load(['employee', 'service', 'business']);

        $bundle = $appointment->booking_reference
            ? Appointment::query()
                ->where('booking_reference', $appointment->booking_reference)
                ->with(['employee', 'service', 'business'])
                ->orderBy('start_time')
                ->get()
            : collect([$appointment]);

        return [
            'appointment' => $appointment,
            'bookingBundle' => $bundle->values()->all(),
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function resolveSlotDurationMinutes($business, array $data): int
    {
        $default = (int) ($business->slot_duration ?? 30);
        $ids = $data['service_ids'] ?? [];
        if (! is_array($ids)) {
            $ids = [];
        }
        $ids = array_values(array_unique(array_map('intval', $ids)));
        if (count($ids) === 0 && ! empty($data['service_id'])) {
            $ids = [(int) $data['service_id']];
        }
        if (count($ids) === 0) {
            return $default;
        }

        $total = 0;
        foreach ($ids as $id) {
            $service = $this->serviceRepository->findById($id);
            if ($service && $service->business_id === $business->id) {
                $total += (int) $service->duration;
            }
        }

        return $total > 0 ? $total : $default;
    }

    private function assertTimeBlockIsBookable(
        $business,
        int $employeeId,
        string $dateYmd,
        Carbon $blockStart,
        Carbon $blockEnd,
        string $timezone
    ): void {
        $date = Carbon::parse($dateYmd, $timezone)->startOfDay();
        $schedule = $this->resolveEffectiveSchedule($employeeId, $date);
        abort_if(! $schedule, 422, 'This time is not available.');

        $scheduleStart = Carbon::parse($dateYmd.' '.$schedule->start_time, $timezone);
        $scheduleEnd = Carbon::parse($dateYmd.' '.$schedule->end_time, $timezone);
        abort_if(
            $blockStart->lt($scheduleStart) || $blockEnd->gt($scheduleEnd),
            422,
            'This time is not available.'
        );

        $minNoticeTime = Carbon::now($timezone)->addMinutes($business->min_booking_notice ?? 60);
        abort_if($blockStart->lt($minNoticeTime), 422, 'This time is not available.');

        foreach ($schedule->breaks as $break) {
            $breakStart = Carbon::parse($dateYmd.' '.$break->start_time, $timezone);
            $breakEnd = Carbon::parse($dateYmd.' '.$break->end_time, $timezone);
            if ($blockStart->lt($breakEnd) && $blockEnd->gt($breakStart)) {
                abort(422, 'This time is not available.');
            }
        }

        $existingAppointments = $this->appointmentRepository->getByEmployeeAndDate($employeeId, $dateYmd);
        foreach ($existingAppointments as $appt) {
            $apptStart = Carbon::parse($dateYmd.' '.$appt->start_time, $timezone);
            $apptEnd = Carbon::parse($dateYmd.' '.$appt->end_time, $timezone);
            if ($blockStart->lt($apptEnd) && $blockEnd->gt($apptStart)) {
                abort(422, 'This time is no longer available.');
            }
        }
    }

    /**
     * Returns the effective schedule for a given employee + date.
     * Checks date-specific overrides first; falls back to the weekly base schedule.
     * Returns null when the employee is unavailable (no schedule or override marks day off).
     */
    private function resolveEffectiveSchedule(int $employeeId, Carbon $date): ?object
    {
        $override = $this->scheduleOverrideRepository->findByUserAndDate($employeeId, $date->toDateString());

        if ($override !== null) {
            return $override->is_active ? $override : null;
        }

        $dayOfWeek = $date->dayOfWeekIso - 1;

        return $this->scheduleRepository->findActiveByUserAndDay($employeeId, $dayOfWeek);
    }

    /**
     * Step between candidate start times for a reservation of {@see $blockMinutes} length.
     * When the service is longer than the business grid (e.g. 30 min service, 15 min grid), step by the
     * full block length so starts align to that duration (no :15/:45-only starts for a 30 min booking).
     */
    private function resolveStepMinutesForSlotBlock(int $businessSlotMinutes, int $blockMinutes): int
    {
        $businessSlotMinutes = max(1, min(120, $businessSlotMinutes));
        $blockMinutes = max(1, min(120, $blockMinutes));

        if ($blockMinutes > $businessSlotMinutes) {
            return $blockMinutes;
        }

        return min($businessSlotMinutes, $blockMinutes);
    }

    private function calculateSlots(
        Carbon $date,
        $schedule,
        int $slotDuration,
        int $stepDuration,
        Carbon $minNoticeTime,
        $existingAppointments,
        string $timezone
    ): array {
        $dateStr = $date->toDateString();
        $scheduleStart = Carbon::parse($dateStr.' '.$schedule->start_time, $timezone);
        $scheduleEnd = Carbon::parse($dateStr.' '.$schedule->end_time, $timezone);
        $stepDuration = max(1, $stepDuration);
        $slotDuration = max(1, $slotDuration);
        // Never step wider than the block being placed (e.g. cap 30 min step for a 15 min service).
        $stepDuration = min($stepDuration, $slotDuration);

        $freeIntervals = $this->buildFreeIntervalsWithinSchedule(
            $dateStr,
            $scheduleStart,
            $scheduleEnd,
            $schedule->breaks,
            $existingAppointments,
            $timezone
        );

        $slots = [];
        foreach ($freeIntervals as $iv) {
            /** @var Carbon $intervalStart */
            $intervalStart = $iv['start'];
            /** @var Carbon $intervalEnd */
            $intervalEnd = $iv['end'];
            if ($intervalEnd->lte($intervalStart)) {
                continue;
            }

            $t = $intervalStart->copy();
            while ($t->copy()->addMinutes($slotDuration)->lte($intervalEnd)) {
                if ($t->gte($minNoticeTime)) {
                    $slotStart = $t->copy();
                    $slotEnd = $t->copy()->addMinutes($slotDuration);
                    if (
                        ! $this->overlapsBreak($slotStart, $slotEnd, $dateStr, $schedule->breaks, $timezone)
                        && ! $this->overlapsAppointment($slotStart, $slotEnd, $dateStr, $existingAppointments, $timezone)
                    ) {
                        $slots[] = $slotStart->format('H:i');
                    }
                }
                $t->addMinutes($stepDuration);
            }
        }

        sort($slots);

        return array_values(array_unique($slots));
    }

    /**
     * @param  Collection<int, mixed>|\Illuminate\Database\Eloquent\Collection  $breaks
     * @param  Collection<int, mixed>|\Illuminate\Database\Eloquent\Collection  $appointments
     * @return array<int, array{start: Carbon, end: Carbon}>
     */
    private function buildFreeIntervalsWithinSchedule(
        string $dateStr,
        Carbon $scheduleStart,
        Carbon $scheduleEnd,
        $breaks,
        $appointments,
        string $timezone
    ): array {
        $intervals = [['start' => $scheduleStart->copy(), 'end' => $scheduleEnd->copy()]];

        foreach ($breaks as $break) {
            $blockStart = Carbon::parse($dateStr.' '.$break->start_time, $timezone);
            $blockEnd = Carbon::parse($dateStr.' '.$break->end_time, $timezone);
            $intervals = $this->subtractBlockedWindow($intervals, $blockStart, $blockEnd);
        }

        foreach ($appointments as $appt) {
            $blockStart = Carbon::parse($dateStr.' '.$appt->start_time, $timezone);
            $blockEnd = Carbon::parse($dateStr.' '.$appt->end_time, $timezone);
            $intervals = $this->subtractBlockedWindow($intervals, $blockStart, $blockEnd);
        }

        return $intervals;
    }

    /**
     * @param  array<int, array{start: Carbon, end: Carbon}>  $intervals
     * @return array<int, array{start: Carbon, end: Carbon}>
     */
    private function subtractBlockedWindow(array $intervals, Carbon $blockStart, Carbon $blockEnd): array
    {
        $out = [];
        foreach ($intervals as $iv) {
            $a = $iv['start'];
            $b = $iv['end'];
            if ($b->lte($blockStart) || $a->gte($blockEnd)) {
                $out[] = ['start' => $a->copy(), 'end' => $b->copy()];

                continue;
            }
            if ($a->lt($blockStart) && $blockStart->lt($b)) {
                $out[] = ['start' => $a->copy(), 'end' => $blockStart->copy()];
            }
            if ($blockEnd->lt($b) && $a->lt($blockEnd)) {
                $out[] = ['start' => $blockEnd->copy(), 'end' => $b->copy()];
            }
        }

        return $out;
    }

    private function overlapsBreak(Carbon $slotStart, Carbon $slotEnd, string $dateStr, $breaks, string $timezone): bool
    {
        foreach ($breaks as $break) {
            $breakStart = Carbon::parse($dateStr.' '.$break->start_time, $timezone);
            $breakEnd = Carbon::parse($dateStr.' '.$break->end_time, $timezone);
            if ($slotStart->lt($breakEnd) && $slotEnd->gt($breakStart)) {
                return true;
            }
        }

        return false;
    }

    private function overlapsAppointment(Carbon $slotStart, Carbon $slotEnd, string $dateStr, $appointments, string $timezone): bool
    {
        foreach ($appointments as $appointment) {
            $apptStart = Carbon::parse($dateStr.' '.$appointment->start_time, $timezone);
            $apptEnd = Carbon::parse($dateStr.' '.$appointment->end_time, $timezone);
            if ($slotStart->lt($apptEnd) && $slotEnd->gt($apptStart)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  Collection<int, Service>  $servicesOrdered
     * @return list<array{start: Carbon, end: Carbon, service: Service}>
     */
    private function buildOrderedServiceSegments(
        Business $business,
        $servicesOrdered,
        string $dateYmd,
        string $startTimeStr,
        string $timezone,
    ): array {
        $cursor = Carbon::parse($dateYmd.' '.$startTimeStr, $timezone);
        $segments = [];
        foreach ($servicesOrdered as $service) {
            abort_if($service->business_id !== $business->id, 422, 'The selected service is not available for this business.');
            $segmentEnd = $cursor->copy()->addMinutes($service->duration);
            $segments[] = [
                'start' => $cursor->copy(),
                'end' => $segmentEnd->copy(),
                'service' => $service,
            ];
            $cursor = $segmentEnd;
        }

        return $segments;
    }

    /**
     * @param  list<array{start: Carbon, end: Carbon, service: Service}>  $segments
     * @return list<int>
     */
    private function collectResourceIdsFromSegments(array $segments): array
    {
        $ids = [];
        foreach ($segments as $segment) {
            foreach ($segment['service']->sharedResources as $sr) {
                $ids[] = $sr->id;
            }
        }

        return array_values(array_unique($ids));
    }

    /**
     * @param  array{start: Carbon, end: Carbon, service: Service}  $segment
     */
    private function assertSegmentResourcesAvailable(
        Business $business,
        string $dateYmd,
        array $segment,
        ?int $excludeAppointmentId,
        string $timezone,
    ): void {
        $service = $segment['service'];
        $windowStart = $segment['start'];
        $windowEnd = $segment['end'];

        foreach ($service->sharedResources as $resource) {
            $qty = (int) $resource->pivot->quantity;
            if (! $this->sharedResourceUsageService->canAllocate(
                $resource,
                $business->id,
                $dateYmd,
                $windowStart,
                $windowEnd,
                $qty,
                $excludeAppointmentId,
                $timezone,
            )) {
                abort(422, 'A required shared resource is not available for this time.');
            }
        }
    }

    private function syncAppointmentSharedResources(Appointment $appointment, Service $service): void
    {
        $sync = [];
        foreach ($service->sharedResources as $res) {
            $sync[$res->id] = ['quantity' => (int) $res->pivot->quantity];
        }
        if ($sync === []) {
            return;
        }
        $appointment->sharedResources()->sync($sync);
    }

    /**
     * @param  list<string>  $slotTimeStrings
     * @param  list<int>  $serviceIdsOrdered
     * @return list<string>
     */
    private function filterSlotTimesForSharedResources(
        Business $business,
        string $dateYmd,
        array $slotTimeStrings,
        array $serviceIdsOrdered,
        string $timezone,
        ?int $excludeAppointmentId,
    ): array {
        $services = collect();
        foreach ($serviceIdsOrdered as $sid) {
            $service = $this->serviceRepository->findById((int) $sid);
            if (! $service || $service->business_id !== $business->id) {
                return [];
            }
            $service->loadMissing('sharedResources');
            $services->push($service);
        }

        if ($services->every(fn (Service $s) => $s->sharedResources->isEmpty())) {
            return $slotTimeStrings;
        }

        $out = [];
        foreach ($slotTimeStrings as $timeStr) {
            $segments = $this->buildOrderedServiceSegments($business, $services, $dateYmd, $timeStr, $timezone);
            $ok = true;
            foreach ($segments as $segment) {
                foreach ($segment['service']->sharedResources as $resource) {
                    $qty = (int) $resource->pivot->quantity;
                    if (! $this->sharedResourceUsageService->canAllocate(
                        $resource,
                        $business->id,
                        $dateYmd,
                        $segment['start'],
                        $segment['end'],
                        $qty,
                        $excludeAppointmentId,
                        $timezone,
                    )) {
                        $ok = false;
                        break 2;
                    }
                }
            }
            if ($ok) {
                $out[] = $timeStr;
            }
        }

        return $out;
    }
}
