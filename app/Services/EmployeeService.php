<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\Business;
use App\Models\User;
use App\Repositories\Interfaces\EmployeeRepositoryInterface;
use App\Repositories\Interfaces\ServiceRepositoryInterface;
use App\Services\Interfaces\EmployeeServiceInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class EmployeeService implements EmployeeServiceInterface
{
    public function __construct(
        private EmployeeRepositoryInterface $employeeRepository,
        private ServiceRepositoryInterface $serviceRepository,
    ) {}

    public function getEmployeesWithServices(Business $business): array
    {
        return [
            'employees' => $this->employeeRepository->getByBusiness($business->id, ['services', 'businessRole']),
            'services' => $this->serviceRepository->getActiveByBusiness($business->id),
        ];
    }

    public function store(Business $business, array $data): User
    {
        $employee = $this->employeeRepository->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'phone' => $data['phone'] ?? null,
            'title' => $data['title'] ?? null,
            'role' => UserRole::Employee,
            'is_active' => true,
            'business_id' => $business->id,
            'business_role_id' => $data['business_role_id'] ?? null,
        ]);

        if (! empty($data['service_ids'])) {
            $this->employeeRepository->syncServices($employee, $data['service_ids']);
        }

        return $employee;
    }

    public function update(Business $business, User $employee, array $data): User
    {
        abort_if($employee->business_id !== $business->id, 403);

        if ($employee->isOwnerOf($business)) {
            unset($data['business_role_id']);
        }

        $wasActive = (bool) $employee->is_active;
        $nextActive = array_key_exists('is_active', $data) ? (bool) $data['is_active'] : $wasActive;

        $this->employeeRepository->update($employee, [
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'title' => $data['title'] ?? null,
            'is_active' => $nextActive,
            'business_role_id' => array_key_exists('business_role_id', $data)
                ? $data['business_role_id']
                : $employee->business_role_id,
        ]);

        if (! empty($data['password'])) {
            $this->employeeRepository->update($employee, ['password' => Hash::make($data['password'])]);
        }

        $this->employeeRepository->syncServices($employee, $data['service_ids'] ?? []);

        if ($wasActive && ! $nextActive) {
            $this->revokeActiveSessions($employee);
        }

        return $employee;
    }

    private function revokeActiveSessions(User $user): void
    {
        if (config('session.driver') !== 'database') {
            return;
        }

        $table = config('session.table', 'sessions');
        DB::table($table)->where('user_id', $user->id)->delete();

        $user->forceFill(['remember_token' => null])->save();
    }

    public function delete(Business $business, User $employee): void
    {
        abort_if($employee->business_id !== $business->id, 403);
        abort_if($employee->isOwnerOf($business), 403);

        $this->employeeRepository->delete($employee);
    }
}
