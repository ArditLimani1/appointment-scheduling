<?php

namespace App\Services;

use App\Enums\AppointmentStatus;
use App\Events\AppointmentCustomerNotificationRequested;
use App\Exports\AppointmentsExport;
use App\Models\Appointment;
use App\Models\Business;
use App\Models\Service;
use App\Models\SharedResource;
use App\Models\User;
use App\Repositories\Interfaces\AppointmentRepositoryInterface;
use App\Repositories\Interfaces\EmployeeRepositoryInterface;
use App\Repositories\Interfaces\ServiceRepositoryInterface;
use App\Services\Interfaces\AppointmentServiceInterface;
use App\Services\Interfaces\BookingServiceInterface;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AppointmentService implements AppointmentServiceInterface
{
    public function __construct(
        private AppointmentRepositoryInterface $appointmentRepository,
        private EmployeeRepositoryInterface $employeeRepository,
        private ServiceRepositoryInterface $serviceRepository,
        private SharedResourceUsageService $sharedResourceUsageService,
        private BookingServiceInterface $bookingService,
    ) {}

    public function getFiltered(Business $business, array $filters, int $perPage = 10): array
    {
        $appointments = $this->appointmentRepository->getFilteredByBusiness($business->id, $filters, $perPage);
        $employees = $this->employeeRepository->getByBusiness($business->id)->load('services');
        $services = $this->serviceRepository->getActiveByBusiness($business->id);

        return [
            'appointments' => $appointments,
            'employees' => $employees->map(fn ($e) => [
                'id' => $e->id,
                'name' => $e->name,
                'service_ids' => $e->services->pluck('id')->values()->toArray(),
            ]),
            'services' => $services->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'duration' => $s->duration,
                'price' => $s->price,
            ]),
            'filters' => [
                'employee_id' => $filters['employee_id'] ?? null,
                'date_from' => $filters['date_from'] ?? null,
                'date_to' => $filters['date_to'] ?? null,
                'status' => $filters['statuses'] ?? [],
                'service_id' => $filters['service_id'] ?? null,
                'search' => isset($filters['search']) && is_string($filters['search']) && trim($filters['search']) !== ''
                    ? trim($filters['search'])
                    : null,
            ],
        ];
    }

    public function getCalendarView(Business $business, string $view, string $anchorDate, array $filters = []): array
    {
        $repoFilters = [];
        if (! empty($filters['employee_id'])) {
            $repoFilters['employee_id'] = (int) $filters['employee_id'];
        }
        if (! empty($filters['statuses']) && is_array($filters['statuses'])) {
            $repoFilters['statuses'] = $filters['statuses'];
        }
        if (! empty($filters['service_id'])) {
            $repoFilters['service_id'] = (int) $filters['service_id'];
        }
        if (! empty($filters['search']) && is_string($filters['search'])) {
            $term = trim($filters['search']);
            if ($term !== '') {
                $repoFilters['search'] = $term;
            }
        }

        $anchor = Carbon::parse($anchorDate)->startOfDay();

        if ($view === 'day') {
            $rangeStart = $anchor->toDateString();
            $rangeEnd = $anchor->toDateString();
            $columnDates = [$rangeStart];
        } else {
            $view = 'week';
            $start = $anchor->copy()->startOfWeek(Carbon::MONDAY);
            $end = $start->copy()->addDays(6);
            $rangeStart = $start->toDateString();
            $rangeEnd = $end->toDateString();
            $columnDates = [];
            for ($d = $start->copy(); $d->lte($end); $d->addDay()) {
                $columnDates[] = $d->toDateString();
            }
        }

        $appointments = $this->appointmentRepository->getForBusinessDateRange($business->id, $rangeStart, $rangeEnd, $repoFilters);

        $employees = $this->employeeRepository->getByBusiness($business->id)->load('services');
        $services = $this->serviceRepository->getActiveByBusiness($business->id);

        $slotDuration = (int) ($business->slot_duration ?? 30);
        if ($slotDuration < 5) {
            $slotDuration = 5;
        }
        if ($slotDuration > 120) {
            $slotDuration = 120;
        }

        return [
            'appointments' => $appointments,
            'employees' => $employees->map(fn ($e) => [
                'id' => $e->id,
                'name' => $e->name,
                'service_ids' => $e->services->pluck('id')->values()->toArray(),
            ]),
            'services' => $services->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'duration' => $s->duration,
                'price' => $s->price,
            ]),
            'calendar_view' => $view,
            'range_start' => $rangeStart,
            'range_end' => $rangeEnd,
            'column_dates' => $columnDates,
            'slot_duration' => $slotDuration,
        ];
    }

    public function updateAppointment(Business $business, Appointment $appointment, array $data): Appointment
    {
        abort_if($appointment->business_id !== $business->id, 403);
        $snapshot = $this->snapshotAppointment($appointment);

        $service = $this->serviceRepository->findById((int) $data['service_id']);
        abort_if(! $service, 422, __('errors.appointment.service_not_found'));
        $service->loadMissing('sharedResources');

        $timezone = $business->timezone ?: config('app.timezone');
        $startTime = Carbon::parse($data['date'].' '.$data['start_time'], $timezone);
        $endTime = $startTime->copy()->addMinutes($service->duration);

        if ($this->hasOverlappingAppointmentForEmployee(
            (int) $data['employee_id'],
            $data['date'],
            $startTime,
            $endTime,
            $appointment->id,
        )) {
            throw ValidationException::withMessages([
                'start_time' => __('errors.appointment.slot_conflict_employee'),
            ]);
        }

        $this->assertStartTimeMatchesAvailableSlots(
            $business,
            (int) $data['employee_id'],
            (int) $data['service_id'],
            $data['date'],
            $startTime,
            $appointment->id,
            false,
        );

        $updated = DB::transaction(function () use ($business, $appointment, $data, $service, $startTime, $endTime) {
            if ($business->uses_shared_resources) {
                $this->validateSharedResourcesForAppointmentWindow(
                    $business,
                    $service,
                    $data['date'],
                    $startTime,
                    $endTime,
                    $appointment->id,
                );
            }

            $updated = $this->appointmentRepository->update($appointment, array_merge($data, [
                'end_time' => $endTime->format('H:i'),
                'price' => $service->price,
                'updated_by' => auth()->id(),
            ]));

            $this->syncAppointmentSharedResources($updated->fresh(), $service, $business);

            return $updated;
        });

        $updatedAppointment = $updated->fresh(['business', 'employee', 'service']);
        $this->dispatchCustomerUpdateNotificationIfNeeded($snapshot, $updatedAppointment);

        return $updatedAppointment;
    }

    public function updateStatus(Business $business, Appointment $appointment, array $data): Appointment
    {
        abort_if($appointment->business_id !== $business->id, 403);
        $requestedStatus = $data['status'] instanceof AppointmentStatus
            ? $data['status']->value
            : (string) $data['status'];
        $currentStatus = $appointment->status instanceof AppointmentStatus
            ? $appointment->status->value
            : (string) $appointment->status;

        if ($requestedStatus === $currentStatus) {
            return $appointment->loadMissing(['business', 'employee', 'service']);
        }

        $snapshot = $this->snapshotAppointment($appointment);
        $updatedRows = Appointment::query()
            ->whereKey($appointment->id)
            ->where('business_id', $business->id)
            ->where('status', '!=', $requestedStatus)
            ->update($data);

        $updatedAppointment = $appointment->fresh(['business', 'employee', 'service']);

        if ($updatedRows === 0 || ! $updatedAppointment) {
            return $appointment->loadMissing(['business', 'employee', 'service']);
        }

        $this->dispatchCustomerUpdateNotificationIfNeeded($snapshot, $updatedAppointment->fresh(['business', 'employee', 'service']));

        return $updatedAppointment;
    }

    public function updateEmployeeAppointmentStatus(int $employeeId, Appointment $appointment, array $data): Appointment
    {
        abort_if($appointment->employee_id !== $employeeId, 403);
        $requestedStatus = $data['status'] instanceof AppointmentStatus
            ? $data['status']->value
            : (string) $data['status'];
        $currentStatus = $appointment->status instanceof AppointmentStatus
            ? $appointment->status->value
            : (string) $appointment->status;

        if ($requestedStatus === $currentStatus) {
            return $appointment->loadMissing(['business', 'employee', 'service']);
        }

        $snapshot = $this->snapshotAppointment($appointment);
        $updatedRows = Appointment::query()
            ->whereKey($appointment->id)
            ->where('employee_id', $employeeId)
            ->where('status', '!=', $requestedStatus)
            ->update($data);

        $updatedAppointment = $appointment->fresh(['business', 'employee', 'service']);

        if ($updatedRows === 0 || ! $updatedAppointment) {
            return $appointment->loadMissing(['business', 'employee', 'service']);
        }

        $this->dispatchCustomerUpdateNotificationIfNeeded($snapshot, $updatedAppointment->fresh(['business', 'employee', 'service']));

        return $updatedAppointment;
    }

    public function updateEmployeeOwnAppointment(int $employeeId, Appointment $appointment, array $data): Appointment
    {
        abort_if($appointment->employee_id !== $employeeId, 403);
        abort_if($appointment->status === AppointmentStatus::Cancelled, 422, __('errors.appointment.cannot_edit_cancelled'));
        $snapshot = $this->snapshotAppointment($appointment);

        $business = $appointment->business;
        abort_unless($business, 404);
        abort_if((int) $appointment->business_id !== (int) $business->id, 403);

        $canEditService = (bool) ($business->allow_employee_service_edit ?? true);
        $serviceId = $canEditService
            ? (int) ($data['service_id'] ?? 0)
            : (int) $appointment->service_id;

        $service = $this->serviceRepository->findById($serviceId);
        abort_if(! $service || (int) $service->business_id !== (int) $business->id, 422, __('errors.appointment.service_not_found'));

        $employee = User::query()->whereKey($employeeId)->with('services')->first();
        abort_unless($employee && $employee->services->contains('id', $serviceId), 422, __('errors.appointment.employee_service_not_offered'));

        $service->loadMissing('sharedResources');

        $timezone = $business->timezone ?: config('app.timezone');
        $startTime = Carbon::parse($data['date'].' '.$data['start_time'], $timezone);
        $endTime = $startTime->copy()->addMinutes($service->duration);

        if ($this->hasOverlappingAppointmentForEmployee(
            $employeeId,
            $data['date'],
            $startTime,
            $endTime,
            $appointment->id,
        )) {
            throw ValidationException::withMessages([
                'start_time' => __('errors.appointment.slot_conflict'),
            ]);
        }

        $this->assertStartTimeMatchesAvailableSlots(
            $business,
            $employeeId,
            $serviceId,
            $data['date'],
            $startTime,
            $appointment->id,
            false,
        );

        $updated = DB::transaction(function () use ($business, $appointment, $data, $serviceId, $service, $startTime, $endTime) {
            if ($business->uses_shared_resources) {
                $this->validateSharedResourcesForAppointmentWindow(
                    $business,
                    $service,
                    $data['date'],
                    $startTime,
                    $endTime,
                    $appointment->id,
                );
            }

            $updated = $this->appointmentRepository->update($appointment, [
                'service_id' => $serviceId,
                'status' => $data['status'],
                'date' => $data['date'],
                'start_time' => $startTime->format('H:i'),
                'end_time' => $endTime->format('H:i'),
                'price' => $service->price,
                'updated_by' => auth()->id(),
            ]);

            $this->syncAppointmentSharedResources($updated->fresh(), $service, $business);

            return $updated;
        });

        $updatedAppointment = $updated->fresh(['business', 'employee', 'service']);
        $this->dispatchCustomerUpdateNotificationIfNeeded($snapshot, $updatedAppointment);

        return $updatedAppointment;
    }

    public function rescheduleEmployeeOwnAppointment(Appointment $appointment, string $dateYmd, string $startTimeStr): void
    {
        abort_if($appointment->employee_id !== auth()->id(), 403);
        abort_if($appointment->status === AppointmentStatus::Cancelled, 422, __('errors.appointment.cannot_reschedule_cancelled'));
        $snapshot = $this->snapshotAppointment($appointment);

        $business = $appointment->business;
        abort_unless($business, 404);

        $service = $this->serviceRepository->findById((int) $appointment->service_id);
        abort_if(! $service || (int) $service->business_id !== (int) $business->id, 422, __('errors.appointment.service_not_found'));
        $service->loadMissing('sharedResources');

        $timezone = $business->timezone ?: config('app.timezone');
        $startTime = Carbon::parse($dateYmd.' '.$startTimeStr, $timezone);
        $endTime = $startTime->copy()->addMinutes($service->duration);

        if ($this->hasOverlappingAppointmentForEmployee(
            (int) $appointment->employee_id,
            $dateYmd,
            $startTime,
            $endTime,
            $appointment->id,
        )) {
            throw ValidationException::withMessages([
                'start_time' => __('errors.appointment.slot_conflict'),
            ]);
        }

        $this->assertStartTimeMatchesAvailableSlots(
            $business,
            (int) $appointment->employee_id,
            (int) $appointment->service_id,
            $dateYmd,
            $startTime,
            $appointment->id,
            false,
        );

        $updated = DB::transaction(function () use ($appointment, $business, $service, $dateYmd, $startTime, $endTime) {
            if ($business->uses_shared_resources) {
                $this->validateSharedResourcesForAppointmentWindow(
                    $business,
                    $service,
                    $dateYmd,
                    $startTime,
                    $endTime,
                    $appointment->id,
                );
            }

            $this->appointmentRepository->update($appointment, [
                'date' => $dateYmd,
                'start_time' => $startTime->format('H:i'),
                'end_time' => $endTime->format('H:i'),
                'updated_by' => auth()->id(),
            ]);

            return $appointment;
        });

        $updatedAppointment = $updated->fresh(['business', 'employee', 'service']);
        $this->dispatchCustomerUpdateNotificationIfNeeded($snapshot, $updatedAppointment);
    }

    /**
     * Same rules as {@see BookingService::getAdminAvailableSlots} for the given flags (conflicts, shared resources; breaks optional).
     */
    private function assertStartTimeMatchesAvailableSlots(
        Business $business,
        int $employeeId,
        int $serviceId,
        string $dateYmd,
        Carbon $startTime,
        ?int $excludeAppointmentId,
        bool $ignoreScheduleBreaks,
    ): void {
        $slots = $this->bookingService->getAdminAvailableSlots($business, [
            'employee_id' => $employeeId,
            'service_id' => $serviceId,
            'date' => $dateYmd,
            'exclude_id' => $excludeAppointmentId,
            'ignore_schedule_breaks' => $ignoreScheduleBreaks,
        ]);

        if (! in_array($startTime->format('H:i'), $slots, true)) {
            throw ValidationException::withMessages([
                'start_time' => $ignoreScheduleBreaks
                    ? __('errors.appointment.outside_hours')
                    : __('errors.appointment.overlaps_break'),
            ]);
        }
    }

    private function validateSharedResourcesForAppointmentWindow(
        Business $business,
        Service $service,
        string $dateYmd,
        Carbon $windowStart,
        Carbon $windowEnd,
        ?int $excludeAppointmentId,
    ): void {
        if (! $business->uses_shared_resources) {
            return;
        }

        $ids = $service->sharedResources->pluck('id')->sort()->values()->all();
        if ($ids === []) {
            return;
        }

        SharedResource::query()->whereIn('id', $ids)->orderBy('id')->lockForUpdate()->get();

        $timezone = $business->timezone ?: config('app.timezone');

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
                throw ValidationException::withMessages([
                    'start_time' => 'A required shared resource is not available for this time.',
                ]);
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
        $appointment->sharedResources()->sync($sync);
    }

    /**
     * True when another appointment on the same day overlaps the proposed window with positive duration.
     * Back-to-back (one ends exactly when the other starts) is not a conflict.
     * Uses Carbon instead of raw SQL time comparisons so SQLite TIME string ordering cannot mis-order adjacent times.
     * Both operands must be parsed in the window's timezone — otherwise appointments stored as
     * wall-clock "H:i" in a non-UTC business (e.g. Europe/Belgrade, UTC+2) would be compared as UTC
     * against tz-aware window bounds and flag false overlaps for any late-morning move.
     */
    private function hasOverlappingAppointmentForEmployee(
        int $employeeId,
        string $dateYmd,
        Carbon $windowStart,
        Carbon $windowEnd,
        ?int $ignoreAppointmentId,
    ): bool {
        $query = Appointment::query()
            ->where('employee_id', $employeeId)
            ->whereDate('date', $dateYmd)
            ->where('status', '!=', AppointmentStatus::Cancelled->value);

        if ($ignoreAppointmentId !== null) {
            $query->where('id', '!=', $ignoreAppointmentId);
        }

        $timezone = $windowStart->timezone;

        return $query->get(['id', 'start_time', 'end_time'])
            ->contains(function (Appointment $other) use ($dateYmd, $windowStart, $windowEnd, $timezone) {
                $otherStart = Carbon::parse($dateYmd.' '.$other->start_time, $timezone);
                $otherEnd = Carbon::parse($dateYmd.' '.$other->end_time, $timezone);

                return $otherStart->lt($windowEnd) && $otherEnd->gt($windowStart);
            });
    }

    public function delete(Business $business, Appointment $appointment): void
    {
        abort_if($appointment->business_id !== $business->id, 403);

        $this->appointmentRepository->delete($appointment);
    }

    public function export(Business $business, array $filters): BinaryFileResponse
    {
        $exportFilters = array_merge($filters, ['business_id' => $business->id]);

        return Excel::download(new AppointmentsExport($exportFilters), __('exports.files.appointments').'.xlsx');
    }

    /**
     * @return array<string, mixed>
     */
    private function snapshotAppointment(Appointment $appointment): array
    {
        $appointment->loadMissing(['business', 'employee', 'service']);

        return [
            'status' => $appointment->status instanceof AppointmentStatus ? $appointment->status->value : (string) $appointment->status,
            'date' => optional($appointment->date)->format('Y-m-d'),
            'start_time' => $appointment->start_time,
            'end_time' => $appointment->end_time,
            'service_id' => $appointment->service_id,
            'service_name' => $appointment->service?->name ?? $appointment->service_name,
            'employee_id' => $appointment->employee_id,
            'employee_name' => $appointment->employee?->name ?? $appointment->employee_name,
        ];
    }

    private function dispatchCustomerUpdateNotificationIfNeeded(array $before, Appointment $appointment): void
    {
        if (! filled($appointment->client_email)) {
            return;
        }

        $notificationType = $this->determineNotificationType($before, $appointment);
        if ($notificationType === null) {
            return;
        }

        event(new AppointmentCustomerNotificationRequested(
            $appointment,
            $notificationType,
            $this->buildChangeSummary($before, $appointment),
        ));
    }

    private function determineNotificationType(array $before, Appointment $appointment): ?string
    {
        $currentStatus = $appointment->status instanceof AppointmentStatus
            ? $appointment->status->value
            : (string) $appointment->status;

        $statusChanged = ($before['status'] ?? null) !== $currentStatus;
        $scheduleChanged = ($before['date'] ?? null) !== optional($appointment->date)->format('Y-m-d')
            || ($before['start_time'] ?? null) !== $appointment->start_time
            || ($before['end_time'] ?? null) !== $appointment->end_time;
        $serviceChanged = ((int) ($before['service_id'] ?? 0)) !== (int) $appointment->service_id;
        $employeeChanged = ((int) ($before['employee_id'] ?? 0)) !== (int) $appointment->employee_id;

        if ($statusChanged && $currentStatus === AppointmentStatus::Cancelled->value) {
            return 'cancelled';
        }

        if ($statusChanged && $currentStatus === AppointmentStatus::Confirmed->value) {
            return 'confirmed';
        }

        if ($scheduleChanged) {
            return 'rescheduled';
        }

        if ($serviceChanged || $employeeChanged) {
            return 'changed';
        }

        return null;
    }

    /**
     * @return list<array{type:string,from:?string,to:?string}>
     */
    private function buildChangeSummary(array $before, Appointment $appointment): array
    {
        $changes = [];
        $currentDate = optional($appointment->date)->format('Y-m-d');

        if (($before['date'] ?? null) !== $currentDate) {
            $changes[] = [
                'type' => 'date',
                'from' => $before['date'] ?? null,
                'to' => $currentDate,
            ];
        }

        if (($before['start_time'] ?? null) !== $appointment->start_time) {
            $changes[] = [
                'type' => 'time',
                'from' => $before['start_time'] ?? null,
                'to' => $appointment->start_time,
            ];
        }

        if (($before['service_id'] ?? null) !== $appointment->service_id) {
            $changes[] = [
                'type' => 'service',
                'from' => $before['service_name'] ?? '—',
                'to' => $appointment->resolvedServiceName() ?? '—',
            ];
        }

        if (($before['employee_id'] ?? null) !== $appointment->employee_id) {
            $changes[] = [
                'type' => 'staff',
                'from' => $before['employee_name'] ?? '—',
                'to' => $appointment->resolvedEmployeeName() ?? '—',
            ];
        }

        $beforeStatus = (string) ($before['status'] ?? '');
        $currentStatus = $appointment->status instanceof AppointmentStatus
            ? $appointment->status->value
            : (string) $appointment->status;
        if ($beforeStatus !== '' && $beforeStatus !== $currentStatus) {
            $changes[] = [
                'type' => 'status',
                'from' => $beforeStatus,
                'to' => $currentStatus,
            ];
        }

        return $changes;
    }
}
