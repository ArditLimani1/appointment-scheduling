<?php

namespace App\Services\Interfaces\SuperAdmin;

use App\Models\BusinessType;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface BusinessTypeManagementServiceInterface
{
    public function paginate(?string $search, ?int $categoryId, int $perPage): LengthAwarePaginator;

    public function categoriesForSelect(): Collection;

    public function create(array $data): BusinessType;

    public function update(BusinessType $type, array $data): BusinessType;

    public function delete(BusinessType $type): ?string;
}
