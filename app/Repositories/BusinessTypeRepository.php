<?php

namespace App\Repositories;

use App\Models\BusinessType;
use App\Repositories\Interfaces\BusinessTypeRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class BusinessTypeRepository implements BusinessTypeRepositoryInterface
{
    public function paginateWithFilters(?string $search, ?int $categoryId, int $perPage): LengthAwarePaginator
    {
        return BusinessType::query()
            ->with('category:id,name')
            ->withCount('businesses')
            ->when($search, fn ($q) => $q->where('name', 'like', "%{$search}%"))
            ->when($categoryId, fn ($q) => $q->where('business_type_category_id', $categoryId))
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function listActiveForSelect(): Collection
    {
        return BusinessType::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    public function create(array $data): BusinessType
    {
        return BusinessType::create($data);
    }

    public function update(BusinessType $type, array $data): BusinessType
    {
        $type->update($data);

        return $type;
    }

    public function delete(BusinessType $type): void
    {
        $type->delete();
    }

    public function hasBusinesses(BusinessType $type): bool
    {
        return $type->businesses()->exists();
    }
}
