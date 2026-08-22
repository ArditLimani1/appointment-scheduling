<?php

namespace App\Services;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Business;
use App\Models\Service;
use App\Models\SharedResource;
use App\Models\User;
use App\Notifications\NewAppointmentsAssignedToEmployee;
use App\Repositories\Interfaces\AppointmentRepositoryInterface;
use App\Repositories\Interfaces\BusinessRepositoryInterface;
use App\Repositories\Interfaces\EmployeeRepositoryInterface;
use App\Repositories\Interfaces\ScheduleOverrideRepositoryInterface;
use App\Repositories\Interfaces\ScheduleRepositoryInterface;
use App\Repositories\Interfaces\ServiceRepositoryInterface;
use App\Services\Interfaces\BookingServiceInterface;
use App\Support\ClientIdentification;
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
        private AppointmentClientNotifier $clientNotifier,
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
            'business' => $this->sanitizePublicBusiness($business),
            'employees' => $employees->map(fn ($e) => $this->sanitizePublicEmployee($e))->values()->all(),
            'services' => $services->map(fn ($s) => $this->sanitizePublicService($s))->values()->all(),
            'slug' => $slug,
            'preselected_employee_id' => $preselectedEmployeeId,
            'booking_today' => $today,
            'booking_max_date' => $maxBookable,
        ];
    }

    private function sanitizePublicBusiness(Business $business): array
    {
        return [
            'id' => $business->id,
            'name' => $business->name,
            'slug' => $business->slug,
            'location' => $business->location,
            'logo' => $business->logo,
            'timezone' => $business->timezone,
            'currency' => $business->currency,
            'currency_symbol' => $business->currency_symbol,
            'slot_duration' => $business->slot_duration,
            'min_booking_notice' => $business->min_booking_notice,
            'max_booking_window' => $business->max_booking_window,
            'client_identifier_type' => ClientIdentification::resolve($business->client_identifier_type),
            'uses_shared_resources' => $business->uses_shared_resources,
        ];
    }

    private function sanitizePublicEmployee(User $employee): array
    {
        return [
            'id' => $employee->id,
            'name' => $employee->name,
            'title' => $employee->title,
            'avatar' => $employee->avatar,
            'booking_slug' => $employee->booking_slug,
            'services' => $employee->relationLoaded('services')
                ? $employee->services->map(fn ($s) => $this->sanitizePublicService($s))->values()->all()
                : [],
            'schedules' => $employee->relationLoaded('schedules')
                ? $employee->schedules->map(fn ($s) => [
                    'id' => $s->id,
                    'day_of_week' => $s->day_of_week,
                    'start_time' => $s->start_time,
                    'end_time' => $s->end_time,
                    'is_active' => $s->is_active,
                ])->values()->all()
                : [],
        ];
    }

    private function sanitizePublicService(Service $service): array
    {
        return [
            'id' => $service->id,
            'name' => $service->name,
            'description' => $service->description,
            'duration' => $service->duration,
            'price' => $service->price,
            'is_popular' => $service->is_popular,
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
            __('errors.booking_flow.employee_invalid')
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
            $timezone,
            false,
        );

        $ids = array_values(array_unique(array_map('intval', $data['service_ids'] ?? [])));
        if ($ids === []) {
            return $slots;
        }

        if (! $business->uses_shared_resources) {
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
            __('errors.booking_flow.employee_invalid')
        );

        $ids = array_values(array_unique(array_map('intval', $data['service_ids'])));
        abort_if(count($ids) === 0, 422, __('errors.booking_flow.select_service'));

        $services = collect();
        foreach ($ids as $serviceId) {
            $service = $this->serviceRepository->findById($serviceId);
            abort_if(
                ! $service || $service->business_id !== $business->id,
                422,
                __('errors.booking_flow.service_invalid')
            );
            $service->loadMissing('sharedResources');
            $services->push($service);
        }

        $timezone = $business->timezone ?: config('app.timezone');
        $startTime = Carbon::parse($data['date'].' '.$data['start_time'], $timezone);
        $totalMinutes = (int) $services->sum('duration');
        $blockEnd = $startTime->copy()->addMinutes($totalMinutes);

        $bookingReference = Str::uuid()->toString();
        $autoConfirm = (bool) $business->auto_confirm_appointments;
        $initialStatus = $autoConfirm ? AppointmentStatus::Confirmed : AppointmentStatus::Pending;

        $created = DB::transaction(function () use ($business, $employeeId, $data, $services, $timezone, $bookingReference, $startTime, $blockEnd, $initialStatus) {
            Appointment::query()
                ->where('employee_id', $employeeId)
                ->whereDate('date', $data['date'])
                ->where('status', '!=', AppointmentStatus::Cancelled->value)
                ->lockForUpdate()
                ->get();

            $this->assertTimeBlockIsBookable(
                $business,
                $employeeId,
                $data['date'],
                $startTime,
                $blockEnd,
                $timezone
            );

            $segments = $this->buildOrderedServiceSegments(
                $business,
                $services,
                $data['date'],
                $data['start_time'],
                $timezone
            );

            if ($business->uses_shared_resources) {
                $resourceIds = $this->collectResourceIdsFromSegments($segments);
                if ($resourceIds !== []) {
                    SharedResource::query()
                        ->whereIn('id', $resourceIds)
                        ->orderBy('id')
                        ->lockForUpdate()
                        ->get();
                }
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
                if ($business->uses_shared_resources) {
                    $this->assertSegmentResourcesAvailable(
                        $business,
                        $data['date'],
                        $segment,
                        null,
                        $timezone
                    );
                }
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
                    'status' => $initialStatus,
                ]);
                $this->syncAppointmentSharedResources($appointment, $service, $business);
                $created->push($appointment);
                $cursor = $segmentEnd;
            }

            $this->notifyAssignedEmployeeOfNewBookings($created, 'public_booking', null);

            return $created;
        });

        if ($autoConfirm) {
            $this->clientNotifier->notify($created->first(), AppointmentClientNotifier::CONFIRMED);
        }

        return $created;
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

        $ignoreScheduleBreaks = filter_var($data['ignore_schedule_breaks'] ?? false, FILTER_VALIDATE_BOOLEAN);

        $slots = $this->calculateSlots(
            $date,
            $schedule,
            $blockMinutes,
            $stepMinutes,
            $minNoticeTime,
            $existingAppointments,
            $timezone,
            $ignoreScheduleBreaks,
        );

        if (empty($data['service_id'])) {
            return $slots;
        }

        $service = $this->serviceRepository->findById((int) $data['service_id']);
        if (! $service || $service->business_id !== $business->id) {
            return $slots;
        }

        $service->loadMissing('sharedResources');
        if (! $business->uses_shared_resources || $service->sharedResources->isEmpty()) {
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

    public function createInternalBooking(Business $business, array $data, string $context): Collection
    {
        abort_unless(in_array($context, ['admin', 'employee'], true), 500, 'Invalid internal booking context.');

        if ($context === 'employee') {
            $authId = auth()->id();
            abort_if($authId === null, 401);
            $data['employee_id'] = (int) $authId;
        }

        $employeeId = (int) ($data['employee_id'] ?? 0);
        abort_if(
            ! $this->employeeRepository->getActiveByBusiness($business->id)->contains('id', $employeeId),
            422,
            __('errors.booking_flow.employee_invalid')
        );

        $rawIds = $data['service_ids'] ?? [];
        if (! is_array($rawIds)) {
            $rawIds = [];
        }
        $ids = array_values(array_unique(array_map('intval', $rawIds)));
        abort_if(count($ids) === 0, 422, __('errors.booking_flow.select_service'));

        $services = collect();
        foreach ($ids as $serviceId) {
            $service = $this->serviceRepository->findById($serviceId);
            abort_if(
                ! $service || $service->business_id !== $business->id,
                422,
                __('errors.booking_flow.service_invalid')
            );
            $service->loadMissing('sharedResources');
            $services->push($service);
        }

        $employeeOffersAll = User::query()
            ->whereKey($employeeId)
            ->with(['services' => fn ($q) => $q->where('is_active', true)])
            ->first();

        foreach ($ids as $sid) {
            abort_if(
                ! $employeeOffersAll || ! $employeeOffersAll->services->contains('id', $sid),
                422,
                __('errors.booking_flow.services_mismatch')
            );
        }

        $timezone = $business->timezone ?: config('app.timezone');
        $startTime = Carbon::parse($data['date'].' '.$data['start_time'], $timezone);
        $totalMinutes = (int) $services->sum('duration');
        $blockEnd = $startTime->copy()->addMinutes($totalMinutes);

        // Booking your own slot needs no confirmation step — you are the one who agreed to it.
        $actorId = (int) (auth()->id() ?? 0);
        $isSelfBooking = $actorId > 0 && $actorId === $employeeId;
        $defaultStatus = $isSelfBooking || (bool) $business->auto_confirm_appointments
            ? AppointmentStatus::Confirmed
            : AppointmentStatus::Pending;

        $bookingReference = Str::uuid()->toString();
        $updatedBy = auth()->id();

        $created = DB::transaction(function () use ($business, $employeeId, $data, $services, $timezone, $bookingReference, $defaultStatus, $updatedBy, $context, $startTime, $blockEnd) {
            Appointment::query()
                ->where('employee_id', $employeeId)
                ->whereDate('date', $data['date'])
                ->where('status', '!=', AppointmentStatus::Cancelled->value)
                ->lockForUpdate()
                ->get();

            $this->assertInternalTimeBlockIsBookable(
                $employeeId,
                $data['date'],
                $startTime,
                $blockEnd,
                $timezone
            );

            $segments = $this->buildOrderedServiceSegments(
                $business,
                $services,
                $data['date'],
                $data['start_time'],
                $timezone
            );

            if ($business->uses_shared_resources) {
                $resourceIds = $this->collectResourceIdsFromSegments($segments);
                if ($resourceIds !== []) {
                    SharedResource::query()
                        ->whereIn('id', $resourceIds)
                        ->orderBy('id')
                        ->lockForUpdate()
                        ->get();
                }
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
                if ($business->uses_shared_resources) {
                    $this->assertSegmentResourcesAvailable(
                        $business,
                        $data['date'],
                        $segment,
                        null,
                        $timezone
                    );
                }
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
                    'status' => $defaultStatus,
                    'updated_by' => $updatedBy,
                ]);
                $this->syncAppointmentSharedResources($appointment, $service, $business);
                $created->push($appointment);
                $cursor = $segmentEnd;
            }

            $this->notifyAssignedEmployeeOfNewBookings($created, $context, auth()->id());

            return $created;
        });

        if ($defaultStatus === AppointmentStatus::Confirmed) {
            $this->clientNotifier->notify($created->first(), AppointmentClientNotifier::CONFIRMED);
        }

        return $created;
    }

    public function getInternalAvailableSlots(Business $business, array $data, string $context): array
    {
        abort_unless(in_array($context, ['admin', 'employee'], true), 500, 'Invalid internal booking context.');

        if ($context === 'employee') {
            $authId = auth()->id();
            abort_if($authId === null, 401);
            $data['employee_id'] = (int) $authId;
        }

        $timezone = $business->timezone ?: config('app.timezone');
        $date = Carbon::parse($data['date'], $timezone)->startOfDay();

        $employeeId = (int) ($data['employee_id'] ?? 0);
        abort_if(
            ! $this->employeeRepository->getActiveByBusiness($business->id)->contains('id', $employeeId),
            422,
            __('errors.booking_flow.employee_invalid')
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

        // Internal flow bypasses min_booking_notice (epoch) and max_booking_window (no max_date check).
        $minNoticeTime = Carbon::createFromTimestamp(0);

        $slots = $this->calculateSlots(
            $date,
            $schedule,
            $slotDuration,
            $stepMinutes,
            $minNoticeTime,
            $existingAppointments,
            $timezone,
            false,
        );

        $rawIds = $data['service_ids'] ?? [];
        if (! is_array($rawIds)) {
            $rawIds = [];
        }
        $ids = array_values(array_unique(array_map('intval', $rawIds)));
        if ($ids === []) {
            return $slots;
        }

        if (! $business->uses_shared_resources) {
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

    public function getConfirmationByReference(string $reference): array
    {
        $bundle = Appointment::query()
            ->where('booking_reference', $reference)
            ->with([
                'employee:id,name,title',
                'service:id,name',
                'business:id,name,slug,location,currency_symbol,client_identifier_type',
            ])
            ->orderBy('start_time')
            ->get();

        abort_if($bundle->isEmpty(), 404);

        $sanitize = fn (Appointment $a) => [
            'id' => $a->id,
            'date' => optional($a->date)->toDateString(),
            'start_time' => $a->start_time,
            'end_time' => $a->end_time,
            'price' => $a->price,
            'status' => $a->status instanceof AppointmentStatus ? $a->status->value : (string) $a->status,
            'service' => $a->service
                ? ['id' => $a->service->id, 'name' => $a->service->name]
                : ($a->resolvedServiceName() ? ['id' => $a->service_id, 'name' => $a->resolvedServiceName()] : null),
            'employee' => $a->employee
                ? [
                    'id' => $a->employee->id,
                    'name' => $a->employee->name,
                    'title' => $a->employee->title,
                ]
                : ($a->resolvedEmployeeName()
                    ? [
                        'id' => $a->employee_id,
                        'name' => $a->resolvedEmployeeName(),
                        'title' => null,
                    ]
                    : null),
            'business' => $a->business ? [
                'id' => $a->business->id,
                'name' => $a->business->name,
                'slug' => $a->business->slug,
                'location' => $a->business->location,
                'currency_symbol' => $a->business->currency_symbol,
                // Tells the confirmation page which channel a pending request will be answered on.
                'notification_channel' => ClientIdentification::resolve($a->business->client_identifier_type),
            ] : null,
        ];

        return [
            'appointment' => $sanitize($bundle->first()),
            'bookingBundle' => $bundle->map($sanitize)->values()->all(),
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

    /**
     * Schedule + breaks + overlap checks for the internal admin/employee
     * create flow. Skips min_booking_notice and max_booking_window — those
     * are intentional for the public flow only.
     */
    private function assertInternalTimeBlockIsBookable(
        int $employeeId,
        string $dateYmd,
        Carbon $blockStart,
        Carbon $blockEnd,
        string $timezone
    ): void {
        $date = Carbon::parse($dateYmd, $timezone)->startOfDay();
        $schedule = $this->resolveEffectiveSchedule($employeeId, $date);
        abort_if(! $schedule, 422, __('errors.booking.time_not_available'));

        $scheduleStart = Carbon::parse($dateYmd.' '.$schedule->start_time, $timezone);
        $scheduleEnd = Carbon::parse($dateYmd.' '.$schedule->end_time, $timezone);
        abort_if(
            $blockStart->lt($scheduleStart) || $blockEnd->gt($scheduleEnd),
            422,
            __('errors.booking.time_not_available')
        );

        foreach ($schedule->breaks as $break) {
            $breakStart = Carbon::parse($dateYmd.' '.$break->start_time, $timezone);
            $breakEnd = Carbon::parse($dateYmd.' '.$break->end_time, $timezone);
            if ($blockStart->lt($breakEnd) && $blockEnd->gt($breakStart)) {
                abort(422, __('errors.booking.time_not_available'));
            }
        }

        $existingAppointments = $this->appointmentRepository->getByEmployeeAndDate($employeeId, $dateYmd);
        foreach ($existingAppointments as $appt) {
            $apptStart = Carbon::parse($dateYmd.' '.$appt->start_time, $timezone);
            $apptEnd = Carbon::parse($dateYmd.' '.$appt->end_time, $timezone);
            if ($blockStart->lt($apptEnd) && $blockEnd->gt($apptStart)) {
                abort(422, __('errors.booking.time_no_longer_available'));
            }
        }
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
        abort_if(! $schedule, 422, __('errors.booking.time_not_available'));

        $scheduleStart = Carbon::parse($dateYmd.' '.$schedule->start_time, $timezone);
        $scheduleEnd = Carbon::parse($dateYmd.' '.$schedule->end_time, $timezone);
        abort_if(
            $blockStart->lt($scheduleStart) || $blockEnd->gt($scheduleEnd),
            422,
            __('errors.booking.time_not_available')
        );

        $minNoticeTime = Carbon::now($timezone)->addMinutes($business->min_booking_notice ?? 60);
        abort_if($blockStart->lt($minNoticeTime), 422, __('errors.booking.time_not_available'));

        foreach ($schedule->breaks as $break) {
            $breakStart = Carbon::parse($dateYmd.' '.$break->start_time, $timezone);
            $breakEnd = Carbon::parse($dateYmd.' '.$break->end_time, $timezone);
            if ($blockStart->lt($breakEnd) && $blockEnd->gt($breakStart)) {
                abort(422, __('errors.booking.time_not_available'));
            }
        }

        $existingAppointments = $this->appointmentRepository->getByEmployeeAndDate($employeeId, $dateYmd);
        foreach ($existingAppointments as $appt) {
            $apptStart = Carbon::parse($dateYmd.' '.$appt->start_time, $timezone);
            $apptEnd = Carbon::parse($dateYmd.' '.$appt->end_time, $timezone);
            if ($blockStart->lt($apptEnd) && $blockEnd->gt($apptStart)) {
                abort(422, __('errors.booking.time_no_longer_available'));
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

        return $this->scheduleRepository->findActiveByUserAndDayForDate($employeeId, $dayOfWeek, $date->toDateString());
    }

    /**
     * Step between candidate start times for a reservation of {@see $blockMinutes} length.
     * Business rule: use the finer cadence between business slot grid and service duration.
     */
    private function resolveStepMinutesForSlotBlock(int $businessSlotMinutes, int $blockMinutes): int
    {
        $businessSlotMinutes = max(1, min(120, $businessSlotMinutes));
        $blockMinutes = max(1, min(120, $blockMinutes));

        return min($businessSlotMinutes, $blockMinutes);
    }

    /**
     * @param  bool  $ignoreScheduleBreaks  When true, scheduled lunch/break windows are treated as bookable.
     */
    private function calculateSlots(
        Carbon $date,
        $schedule,
        int $slotDuration,
        int $stepDuration,
        Carbon $minNoticeTime,
        $existingAppointments,
        string $timezone,
        bool $ignoreScheduleBreaks = false,
    ): array {
        $dateStr = $date->toDateString();
        $scheduleStart = Carbon::parse($dateStr.' '.$schedule->start_time, $timezone);
        $scheduleEnd = Carbon::parse($dateStr.' '.$schedule->end_time, $timezone);
        $stepDuration = max(1, $stepDuration);
        $slotDuration = max(1, $slotDuration);
        // Never step wider than the block being placed (e.g. cap 30 min step for a 15 min service).
        $stepDuration = min($stepDuration, $slotDuration);

        $breaksForIntervals = $ignoreScheduleBreaks ? collect() : $schedule->breaks;

        $freeIntervals = $this->buildFreeIntervalsWithinSchedule(
            $dateStr,
            $scheduleStart,
            $scheduleEnd,
            $breaksForIntervals,
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

            // Each free interval already begins at a real boundary (open time, after a break,
            // after an appointment, etc.). Start stepping from that boundary directly — do not
            // re-phase to the business open time, or mid-day gaps like 11:45–13:00 can incorrectly
            // snap forward to 12:00.
            $t = $intervalStart->copy();
            while ($t->copy()->addMinutes($slotDuration)->lte($intervalEnd)) {
                if ($t->gte($minNoticeTime)) {
                    $slotStart = $t->copy();
                    $slotEnd = $t->copy()->addMinutes($slotDuration);
                    $overlapsBreak = $ignoreScheduleBreaks
                        ? false
                        : $this->overlapsBreak($slotStart, $slotEnd, $dateStr, $schedule->breaks, $timezone);
                    if (
                        ! $overlapsBreak
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
            abort_if($service->business_id !== $business->id, 422, __('errors.booking_flow.service_invalid'));
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
        if (! $business->uses_shared_resources) {
            return;
        }

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
                abort(422, __('errors.booking.shared_resource_unavailable'));
            }
        }
    }

    private function syncAppointmentSharedResources(Appointment $appointment, Service $service, Business $business): void
    {
        if (! $business->uses_shared_resources) {
            $appointment->sharedResources()->sync([]);

            return;
        }

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
        if (! $business->uses_shared_resources) {
            return $slotTimeStrings;
        }

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

    /**
     * @param  Collection<int, Appointment>  $appointments
     * @param  'public_booking'|'admin'|'employee'  $source
     */
    private function notifyAssignedEmployeeOfNewBookings(Collection $appointments, string $source, ?int $actorUserId): void
    {
        if ($appointments->isEmpty()) {
            return;
        }

        $employeeId = (int) $appointments->first()->employee_id;
        if ($source === 'employee' && $actorUserId !== null && $actorUserId === $employeeId) {
            return;
        }

        foreach ($appointments as $appointment) {
            if ($appointment instanceof Appointment) {
                $appointment->loadMissing(['service', 'business']);
            }
        }
        $first = $appointments->first();
        $last = $appointments->last();
        if (! $first instanceof Appointment) {
            return;
        }

        $clientName = trim($first->client_first_name.' '.$first->client_last_name);
        $payload = [
            'kind' => 'new_appointments',
            'booking_reference' => $first->booking_reference,
            'client_name' => $clientName,
            'date' => $first->date?->format('Y-m-d'),
            'start_time' => $first->start_time,
            'end_time' => $last instanceof Appointment ? $last->end_time : $first->end_time,
            'services' => $appointments->map(fn (Appointment $a) => [
                'id' => $a->service_id,
                'name' => $a->service?->name ?? '',
            ])->values()->all(),
            'appointment_ids' => $appointments->map(fn (Appointment $a) => $a->id)->values()->all(),
            'source' => $source,
            'business_name' => $first->business?->name,
        ];

        DB::afterCommit(function () use ($employeeId, $payload): void {
            $user = User::query()->find($employeeId);
            if ($user !== null) {
                $user->notify(new NewAppointmentsAssignedToEmployee($payload));
            }
        });
    }

}
