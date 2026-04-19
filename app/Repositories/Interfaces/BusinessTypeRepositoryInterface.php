<?php

namespace App\Repositories\Interfaces;

use App\Models\BusinessType;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface BusinessTypeRepositoryInterface
{
    public function paginateWithFilters(?string $search, ?int $categoryId, int $perPage): LengthAwarePaginator;

    public function listActiveForSelect(): Collection;

    public function create(array $data): BusinessType;

    public function update(BusinessType $type, array $data): BusinessType;

    public function delete(BusinessType $type): void;

    public function hasBusinesses(BusinessType $type): bool;
}
