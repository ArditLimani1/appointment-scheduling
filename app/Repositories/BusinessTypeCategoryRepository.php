<?php

namespace App\Repositories;

use App\Models\BusinessTypeCategory;
use App\Repositories\Interfaces\BusinessTypeCategoryRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class BusinessTypeCategoryRepository implements BusinessTypeCategoryRepositoryInterface
{
    public function allWithTypeCounts(): Collection
    {
        return BusinessTypeCategory::query()
            ->withCount('businessTypes')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();
    }

    public function listForSelect(): Collection
    {
        return BusinessTypeCategory::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    public function create(array $data): BusinessTypeCategory
    {
        return BusinessTypeCategory::create($data);
    }

    public function update(BusinessTypeCategory $category, array $data): BusinessTypeCategory
    {
        $category->update($data);

        return $category;
    }

    public function delete(BusinessTypeCategory $category): void
    {
        $category->delete();
    }

    public function hasTypes(BusinessTypeCategory $category): bool
    {
        return $category->businessTypes()->exists();
    }
}
