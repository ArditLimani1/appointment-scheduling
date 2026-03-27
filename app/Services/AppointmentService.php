<?php

namespace App\Services;

use App\Exports\AppointmentsExport;
use App\Models\Appointment;
use App\Models\Business;
use App\Repositories\Interfaces\AppointmentRepositoryInterface;
use App\Repositories\Interfaces\EmployeeRepositoryInterface;
use App\Services\Interfaces\AppointmentServiceInterface;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AppointmentService implements AppointmentServiceInterface
{
    public function __construct(
        private AppointmentRepositoryInterface $appointmentRepository,
        private EmployeeRepositoryInterface $employeeRepository,
    ) {}

    public function getFiltered(Business $business, array $filters, int $perPage = 20): array
    {
        $appointments = $this->appointmentRepository->getFilteredByBusiness($business->id, $filters, $perPage);
        $employees = $this->employeeRepository->getByBusiness($business->id);

        return [
            'appointments' => $appointments,
            'employees' => $employees->map(fn ($e) => ['id' => $e->id, 'name' => $e->name]),
            'filters' => $filters,
        ];
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
