<?php

namespace App\Services\Interfaces;

use App\Models\Appointment;
use App\Models\Business;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

interface AppointmentServiceInterface
{
    public function getFiltered(Business $business, array $filters, int $perPage = 10): array;

    /**
     * Appointments and lookup data for the admin calendar (day or week columns).
     *
     * @param  'day'|'week'  $view
     * @param  array{employee_id?: int|string|null, statuses?: list<string>}  $filters
     * @return array{appointments: \Illuminate\Database\Eloquent\Collection, employees: Collection, services: Collection, calendar_view: string, range_start: string, range_end: string, column_dates: array<int, string>, slot_duration: int}
     */
    public function getCalendarView(Business $business, string $view, string $anchorDate, array $filters = []): array;

    public function updateAppointment(Business $business, Appointment $appointment, array $data): Appointment;

    public function updateStatus(Business $business, Appointment $appointment, array $data): Appointment;

    public function updateEmployeeAppointmentStatus(int $employeeId, Appointment $appointment, array $data): Appointment;

    /**
     * Full update for the staff member who owns the appointment (service, status, date, time). Employee cannot be reassigned.
     */
    public function updateEmployeeOwnAppointment(int $employeeId, Appointment $appointment, array $data): Appointment;

    public function delete(Business $business, Appointment $appointment): void;

    public function export(Business $business, array $filters): BinaryFileResponse;
}
