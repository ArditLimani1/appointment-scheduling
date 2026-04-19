<?php

namespace App\Services\SuperAdmin;

use App\Models\BusinessType;
use App\Repositories\Interfaces\BusinessTypeCategoryRepositoryInterface;
use App\Repositories\Interfaces\BusinessTypeRepositoryInterface;
use App\Services\AuditLogger;
use App\Services\Interfaces\SuperAdmin\BusinessTypeManagementServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class BusinessTypeManagementService implements BusinessTypeManagementServiceInterface
{
    public function __construct(
        private BusinessTypeRepositoryInterface $types,
        private BusinessTypeCategoryRepositoryInterface $categories,
    ) {}

    public function paginate(?string $search, ?int $categoryId, int $perPage): LengthAwarePaginator
    {
        return $this->types->paginateWithFilters($search, $categoryId, $perPage);
    }

    public function categoriesForSelect(): Collection
    {
        return $this->categories->listForSelect();
    }

    public function create(array $data): BusinessType
    {
        $type = $this->types->create($data);

        AuditLogger::log('business_type.created', $type, $data, $type->name);

        return $type;
    }

    public function update(BusinessType $type, array $data): BusinessType
    {
        $type = $this->types->update($type, $data);

        AuditLogger::log('business_type.updated', $type, $data, $type->name);

        return $type;
    }

    public function delete(BusinessType $type): ?string
    {
        if ($this->types->hasBusinesses($type)) {
            return null;
        }

        $label = $type->name;
        $this->types->delete($type);

        AuditLogger::log('business_type.deleted', null, ['name' => $label], $label);

        return $label;
    }
}
