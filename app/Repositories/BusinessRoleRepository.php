<?php

namespace App\Repositories;

use App\Models\BusinessRole;
use App\Repositories\Interfaces\BusinessRoleRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class BusinessRoleRepository implements BusinessRoleRepositoryInterface
{
    public function getByBusiness(int $businessId): Collection
    {
        return BusinessRole::query()
            ->where('business_id', $businessId)
            ->orderBy('name')
            ->get();
    }

    public function create(array $data): BusinessRole
    {
        return BusinessRole::query()->create($data);
    }

    public function update(BusinessRole $role, array $data): BusinessRole
    {
        $role->update($data);

        return $role;
    }

    public function delete(BusinessRole $role): void
    {
        $role->delete();
    }
}
