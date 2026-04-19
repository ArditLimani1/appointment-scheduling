<?php

namespace App\Services\Interfaces\SuperAdmin;

use App\Models\BusinessTypeCategory;
use Illuminate\Database\Eloquent\Collection;

interface BusinessTypeCategoryManagementServiceInterface
{
    public function listAll(): Collection;

    public function create(array $data): BusinessTypeCategory;

    public function update(BusinessTypeCategory $category, array $data): BusinessTypeCategory;

    public function delete(BusinessTypeCategory $category): ?string;
}
