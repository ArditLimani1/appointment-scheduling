<?php

namespace App\Services;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Repositories\Interfaces\AppointmentRepositoryInterface;
use App\Repositories\Interfaces\BusinessRepositoryInterface;
use App\Repositories\Interfaces\EmployeeRepositoryInterface;
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
        private AppointmentRepositoryInterface $appointmentRepository,
    ) {}

    public function getBookingPageData(string $slug): array
    {
        $business = $this->businessRepository->findActiveBySlug($slug);

        $employees = $this->employeeRepository->getActiveByBusiness($business->id, [
            'services' => fn ($query) => $query->where('is_active', true),
            'schedules',
        ]);

        $services = $this->serviceRepository->getActiveByBusiness($business->id);

        return [
            'business' => $business,
            'employees' => $employees,
            'services' => $services,
            'slug' => $slug,
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
        $dayOfWeek = $date->dayOfWeekIso - 1;

        $employeeId = (int) $data['employee_id'];
        abort_if(
            ! $this->employeeRepository->getActiveByBusiness($business->id)->contains('id', $employeeId),
            422,
            'The selected employee is not available for this business.'
        );

        $schedule = $this->scheduleRepository->findActiveByUserAndDay($employeeId, $dayOfWeek);
        if (! $schedule) {
            return [];
        }

        $slotDuration = $this->resolveSlotDurationMinutes($business, $data);

        $existingAppointments = $this->appointmentRepository->getByEmployeeAndDate(
            $employeeId,
            $date->toDateString()
        );

        return $this->calculateSlots(
            $date,
            $schedule,
            $slotDuration,
            $business->slot_duration ?? 30,
            $minNoticeTime,
            $existingAppointments,
            $timezone
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
            $created = collect();
            $cursor = Carbon::parse($data['date'].' '.$data['start_time'], $timezone);

            foreach ($services as $service) {
                $segmentEnd = $cursor->copy()->addMinutes($service->duration);
                $created->push($this->appointmentRepository->create([
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
                ]));
                $cursor = $segmentEnd;
            }

            return $created;
        });
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
        $dayOfWeek = $date->dayOfWeekIso - 1;
        $schedule = $this->scheduleRepository->findActiveByUserAndDay($employeeId, $dayOfWeek);
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
}
