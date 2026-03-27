<?php

namespace App\Services\Interfaces;

use App\Models\Appointment;
use App\Models\Business;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

interface AppointmentServiceInterface
{
    public function getFiltered(Business $business, array $filters, int $perPage = 20): array;

    public function updateStatus(Business $business, Appointment $appointment, array $data): Appointment;

    public function updateEmployeeAppointmentStatus(int $employeeId, Appointment $appointment, array $data): Appointment;

    public function delete(Business $business, Appointment $appointment): void;

    public function export(Business $business, array $filters): BinaryFileResponse;
}
