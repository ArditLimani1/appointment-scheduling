<?php

namespace App\Services;

use App\Enums\Permission;
use App\Models\Business;
use App\Models\BusinessRole;
use App\Models\User;
use App\Repositories\Interfaces\BusinessRoleRepositoryInterface;
use App\Services\Interfaces\BusinessRoleServiceInterface;
use Illuminate\Database\Eloquent\Collection;

class BusinessRoleService implements BusinessRoleServiceInterface
{
    public function __construct(
        private BusinessRoleRepositoryInterface $businessRoleRepository,
    ) {}

    public function listForBusiness(Business $business): Collection
    {
        return $this->businessRoleRepository->getByBusiness($business->id);
    }

    public function store(Business $business, array $data): BusinessRole
    {
        return $this->businessRoleRepository->create([
            'business_id' => $business->id,
            'name' => $data['name'],
            'permissions' => array_values(array_unique($data['permissions'])),
        ]);
    }

    public function update(Business $business, BusinessRole $role, array $data): BusinessRole
    {
        abort_unless($role->business_id === $business->id, 404);

        return $this->businessRoleRepository->update($role, [
            'name' => $data['name'],
            'permissions' => array_values(array_unique($data['permissions'])),
        ]);
    }

    public function delete(Business $business, BusinessRole $role): void
    {
        abort_unless($role->business_id === $business->id, 404);

        User::query()->where('business_role_id', $role->id)->update(['business_role_id' => null]);

        $this->businessRoleRepository->delete($role);
    }

    public function permissionGroupsForUi(): array
    {
        $map = fn (Permission $p) => ['value' => $p->value, 'label' => $p->label()];

        return [
            'admin' => array_map($map, Permission::adminCases()),
            'employee' => array_map($map, Permission::employeeCases()),
        ];
    }
}
