<?php

namespace App\Services\Interfaces;

use App\Models\Business;
use App\Models\BusinessRole;
use Illuminate\Database\Eloquent\Collection;

interface BusinessRoleServiceInterface
{
    public function listForBusiness(Business $business): Collection;

    public function store(Business $business, array $data): BusinessRole;

    public function update(Business $business, BusinessRole $role, array $data): BusinessRole;

    public function delete(Business $business, BusinessRole $role): void;

    /**
     * @return array{admin: array<int, array{value: string, label: string}>, employee: array<int, array{value: string, label: string}>}
     */
    public function permissionGroupsForUi(): array;
}
