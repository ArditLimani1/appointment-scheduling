<?php

namespace App\Repositories\Interfaces;

use App\Models\BusinessTypeCategory;
use Illuminate\Database\Eloquent\Collection;

interface BusinessTypeCategoryRepositoryInterface
{
    public function allWithTypeCounts(): Collection;

    public function listForSelect(): Collection;

    public function create(array $data): BusinessTypeCategory;

    public function update(BusinessTypeCategory $category, array $data): BusinessTypeCategory;

    public function delete(BusinessTypeCategory $category): void;

    public function hasTypes(BusinessTypeCategory $category): bool;
}
