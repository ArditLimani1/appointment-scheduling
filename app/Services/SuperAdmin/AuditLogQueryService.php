<?php

namespace App\Services\SuperAdmin;

use App\Repositories\Interfaces\AuditLogRepositoryInterface;
use App\Services\Interfaces\SuperAdmin\AuditLogQueryServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class AuditLogQueryService implements AuditLogQueryServiceInterface
{
    public function __construct(
        private AuditLogRepositoryInterface $auditLogs,
    ) {}

    public function paginate(?string $search, ?string $action, ?int $actorId, int $perPage): LengthAwarePaginator
    {
        return $this->auditLogs->paginateWithFilters($search, $action, $actorId, $perPage);
    }

    public function availableActions(): Collection
    {
        return $this->auditLogs->distinctActions();
    }
}
