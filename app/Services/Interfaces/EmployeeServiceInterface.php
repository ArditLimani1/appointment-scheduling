<?php

namespace App\Services\Interfaces;

use App\Models\Business;
use App\Models\User;

interface EmployeeServiceInterface
{
    public function getEmployeesWithServices(Business $business): array;

    public function store(Business $business, array $data): User;

    public function update(Business $business, User $employee, array $data): User;

    /**
     * @param  bool  $deleteAppointments  When true, all appointments for this employee are removed. When false, appointments are kept with an employee name snapshot and unlinked unless blocked by upcoming pending/confirmed bookings.
     */
    public function delete(Business $business, User $employee, bool $deleteAppointments): void;
}
