<?php

namespace App\Services;

use App\Enums\AppointmentStatus;
use App\Exports\AppointmentsExport;
use App\Models\Appointment;
use App\Models\Business;
use App\Repositories\Interfaces\AppointmentRepositoryInterface;
use App\Repositories\Interfaces\EmployeeRepositoryInterface;
use App\Repositories\Interfaces\ServiceRepositoryInterface;
use App\Services\Interfaces\AppointmentServiceInterface;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AppointmentService implements AppointmentServiceInterface
{
    public function __construct(
        private AppointmentRepositoryInterface $appointmentRepository,
        private EmployeeRepositoryInterface $employeeRepository,
        private ServiceRepositoryInterface $serviceRepository,
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
        ];
    }

    public function updateAppointment(Business $business, Appointment $appointment, array $data): Appointment
    {
        abort_if($appointment->business_id !== $business->id, 403);

        $service = $this->serviceRepository->findById((int) $data['service_id']);
        abort_if(! $service, 422, 'Service not found.');

        $startTime = Carbon::parse($data['date'].' '.$data['start_time']);
        $endTime = $startTime->copy()->addMinutes($service->duration);

        // Check if the new time window overlaps with any other appointment for this employee
        $hasConflict = Appointment::where('employee_id', (int) $data['employee_id'])
            ->whereDate('date', $data['date'])
            ->where('id', '!=', $appointment->id)
            ->where('status', '!=', AppointmentStatus::Cancelled->value)
            ->where('start_time', '<', $endTime->format('H:i:s'))
            ->where('end_time', '>', $startTime->format('H:i:s'))
            ->exists();

        if ($hasConflict) {
            throw ValidationException::withMessages([
                'start_time' => 'This time slot conflicts with another appointment for this employee. Please choose a different time or date where the employee is available.',
            ]);
        }

        return $this->appointmentRepository->update($appointment, array_merge($data, [
            'end_time' => $endTime->format('H:i'),
            'price' => $service->price,
            'updated_by' => auth()->id(),
        ]));
    }

    public function updateStatus(Business $business, Appointment $appointment, array $data): Appointment
    {
        abort_if($appointment->business_id !== $business->id, 403);

        return $this->appointmentRepository->update($appointment, $data);
    }

    public function updateEmployeeAppointmentStatus(int $employeeId, Appointment $appointment, array $data): Appointment
    {
        abort_if($appointment->employee_id !== $employeeId, 403);

        return $this->appointmentRepository->update($appointment, $data);
    }

    public function delete(Business $business, Appointment $appointment): void
    {
        abort_if($appointment->business_id !== $business->id, 403);

        $this->appointmentRepository->delete($appointment);
    }

    public function export(Business $business, array $filters): BinaryFileResponse
    {
        $exportFilters = array_merge($filters, ['business_id' => $business->id]);

        return Excel::download(new AppointmentsExport($exportFilters), 'appointments.xlsx');
    }
}
