<?php

namespace App\Repositories;

use App\Enums\UserRole;
use App\Models\User;
use App\Repositories\Interfaces\EmployeeRepositoryInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class EmployeeRepository implements EmployeeRepositoryInterface
{
    /**
     * Employees plus the business owner when they opted in as bookable staff.
     */
    private function staffMembersBaseQuery(int $businessId): Builder
    {
        return User::query()
            ->where('business_id', $businessId)
            ->where(function (Builder $q) {
                $q->where('role', UserRole::Employee)
                    ->orWhere(function (Builder $q2) {
                        $q2->where('role', UserRole::Admin)
                            ->where('also_works_as_staff', true);
                    });
            });
    }

    public function getByBusiness(int $businessId, array $with = []): Collection
    {
        return $this->staffMembersBaseQuery($businessId)
            ->with($with)
            ->get();
    }

    public function getActiveByBusiness(int $businessId, array $with = []): Collection
    {
        return $this->staffMembersBaseQuery($businessId)
            ->where('is_active', true)
            ->with($with)
            ->get();
    }

    public function countByBusiness(int $businessId): int
    {
        return $this->staffMembersBaseQuery($businessId)->count();
    }

    public function countActiveByBusiness(int $businessId): int
    {
        return $this->staffMembersBaseQuery($businessId)
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
