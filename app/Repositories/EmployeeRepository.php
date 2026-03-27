<?php

namespace App\Repositories;

use App\Models\User;
use App\Repositories\Interfaces\EmployeeRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class EmployeeRepository implements EmployeeRepositoryInterface
{
    public function getByBusiness(int $businessId, array $with = []): Collection
    {
        return User::where('business_id', $businessId)
            ->where('role', 'employee')
            ->with($with)
            ->get();
    }

    public function getActiveByBusiness(int $businessId, array $with = []): Collection
    {
        return User::where('business_id', $businessId)
            ->where('role', 'employee')
            ->where('is_active', true)
            ->with($with)
            ->get();
    }

    public function countByBusiness(int $businessId): int
    {
        return User::where('business_id', $businessId)
            ->where('role', 'employee')
            ->count();
    }

    public function countActiveByBusiness(int $businessId): int
    {
        return User::where('business_id', $businessId)
            ->where('role', 'employee')
            ->where('is_active', true)
            ->count();
    }

    public function create(array $data): User
    {
        return User::create($data);
    }

    public function update(User $employee, array $data): User
    {
        $employee->update($data);

        return $employee;
    }

    public function delete(User $employee): void
    {
        $employee->services()->detach();
        $employee->delete();
    }

    public function syncServices(User $employee, array $serviceIds): void
    {
        $employee->services()->sync($serviceIds);
    }
}
