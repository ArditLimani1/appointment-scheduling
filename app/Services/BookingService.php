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
        $date = Carbon::parse($data['date']);

        $maxDate = Carbon::today()->addDays($business->max_booking_window ?? 30);
        if ($date->gt($maxDate)) {
            return [];
        }

        $minNoticeTime = Carbon::now()->addMinutes($business->min_booking_notice ?? 60);
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

        $slotDuration = $business->slot_duration ?? 30;
        if (! empty($data['service_id'])) {
            $service = $this->serviceRepository->findById((int) $data['service_id']);
            if ($service && $service->business_id === $business->id) {
                $slotDuration = $service->duration;
            }
        }

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
            $existingAppointments
        );
    }

    public function createBooking(string $slug, array $data): Appointment
    {
        $business = $this->businessRepository->findActiveBySlug($slug);

        $employeeId = (int) $data['employee_id'];
        abort_if(
            ! $this->employeeRepository->getActiveByBusiness($business->id)->contains('id', $employeeId),
            422,
            'The selected employee is not available for this business.'
        );

        $service = $this->serviceRepository->findById((int) $data['service_id']);
        abort_if(! $service || $service->business_id !== $business->id, 422, 'The selected service is not available for this business.');

        $startTime = Carbon::parse($data['date'].' '.$data['start_time']);
        $endTime = $startTime->copy()->addMinutes($service->duration);

        return $this->appointmentRepository->create([
            'business_id' => $business->id,
            'employee_id' => $employeeId,
            'service_id' => $data['service_id'],
            'client_first_name' => $data['client_first_name'],
            'client_last_name' => $data['client_last_name'],
            'client_phone' => $data['client_phone'],
            'client_notes' => $data['client_notes'] ?? null,
            'date' => $data['date'],
            'start_time' => $startTime->format('H:i'),
            'end_time' => $endTime->format('H:i'),
            'price' => $service->price,
            'status' => AppointmentStatus::Pending,
        ]);
    }

    public function getConfirmation(Appointment $appointment): array
    {
        $appointment->load(['employee', 'service', 'business']);

        return ['appointment' => $appointment];
    }

    private function calculateSlots(
        Carbon $date,
        $schedule,
        int $slotDuration,
        int $stepDuration,
        Carbon $minNoticeTime,
        $existingAppointments
    ): array {
        $slots = [];
        $scheduleStart = Carbon::parse($date->toDateString().' '.$schedule->start_time);
        $scheduleEnd = Carbon::parse($date->toDateString().' '.$schedule->end_time);
        $current = $scheduleStart->copy();

        while ($current->copy()->addMinutes($slotDuration)->lte($scheduleEnd)) {
            $slotStart = $current->copy();
            $slotEnd = $current->copy()->addMinutes($slotDuration);

            if ($slotStart->lt($minNoticeTime)) {
                $current->addMinutes($stepDuration);

                continue;
            }

            if ($this->overlapsBreak($slotStart, $slotEnd, $date, $schedule->breaks)) {
                $current->addMinutes($stepDuration);

                continue;
            }

            if ($this->overlapsAppointment($slotStart, $slotEnd, $date, $existingAppointments)) {
                $current->addMinutes($stepDuration);

                continue;
            }

            $slots[] = $slotStart->format('H:i');
            $current->addMinutes($stepDuration);
        }

        return $slots;
    }

    private function overlapsBreak(Carbon $slotStart, Carbon $slotEnd, Carbon $date, $breaks): bool
    {
        foreach ($breaks as $break) {
            $breakStart = Carbon::parse($date->toDateString().' '.$break->start_time);
            $breakEnd = Carbon::parse($date->toDateString().' '.$break->end_time);
            if ($slotStart->lt($breakEnd) && $slotEnd->gt($breakStart)) {
                return true;
            }
        }

        return false;
    }

    private function overlapsAppointment(Carbon $slotStart, Carbon $slotEnd, Carbon $date, $appointments): bool
    {
        foreach ($appointments as $appointment) {
            $apptStart = Carbon::parse($date->toDateString().' '.$appointment->start_time);
            $apptEnd = Carbon::parse($date->toDateString().' '.$appointment->end_time);
            if ($slotStart->lt($apptEnd) && $slotEnd->gt($apptStart)) {
                return true;
            }
        }

        return false;
    }
}
