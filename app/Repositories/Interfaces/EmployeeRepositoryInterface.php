<?php

namespace App\Repositories\Interfaces;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

interface EmployeeRepositoryInterface
{
    public function getByBusiness(int $businessId, array $with = []): Collection;

    public function getActiveByBusiness(int $businessId, array $with = []): Collection;

    public function countByBusiness(int $businessId): int;

    public function countActiveByBusiness(int $businessId): int;

    public function create(array $data): User;

    public function update(User $employee, array $data): User;

    public function delete(User $employee): void;

    public function syncServices(User $employee, array $serviceIds): void;
}
