<?php

namespace App\Repositories\Interfaces;

use App\Models\BusinessRole;
use Illuminate\Database\Eloquent\Collection;

interface BusinessRoleRepositoryInterface
{
    public function getByBusiness(int $businessId): Collection;

    public function create(array $data): BusinessRole;

    public function update(BusinessRole $role, array $data): BusinessRole;

    public function delete(BusinessRole $role): void;
}
