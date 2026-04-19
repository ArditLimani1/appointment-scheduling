<?php

namespace App\Services\SuperAdmin;

use App\Models\BusinessTypeCategory;
use App\Repositories\Interfaces\BusinessTypeCategoryRepositoryInterface;
use App\Services\AuditLogger;
use App\Services\Interfaces\SuperAdmin\BusinessTypeCategoryManagementServiceInterface;
use Illuminate\Database\Eloquent\Collection;

class BusinessTypeCategoryManagementService implements BusinessTypeCategoryManagementServiceInterface
{
    public function __construct(
        private BusinessTypeCategoryRepositoryInterface $categories,
    ) {}

    public function listAll(): Collection
    {
        return $this->categories->allWithTypeCounts();
    }

    public function create(array $data): BusinessTypeCategory
    {
        $category = $this->categories->create([
            'name' => $data['name'],
            'sort_order' => $data['sort_order'] ?? 0,
        ]);

        AuditLogger::log('business_type_category.created', $category, ['name' => $category->name], $category->name);

        return $category;
    }

    public function update(BusinessTypeCategory $category, array $data): BusinessTypeCategory
    {
        $category = $this->categories->update($category, [
            'name' => $data['name'],
            'sort_order' => $data['sort_order'] ?? 0,
        ]);

        AuditLogger::log('business_type_category.updated', $category, $data, $category->name);

        return $category;
    }

    public function delete(BusinessTypeCategory $category): ?string
    {
        if ($this->categories->hasTypes($category)) {
            return null;
        }

        $label = $category->name;
        $this->categories->delete($category);

        AuditLogger::log('business_type_category.deleted', null, ['name' => $label], $label);

        return $label;
    }
}
