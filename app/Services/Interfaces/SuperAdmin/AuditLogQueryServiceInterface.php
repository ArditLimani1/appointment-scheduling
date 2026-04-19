<?php

namespace App\Services\Interfaces\SuperAdmin;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface AuditLogQueryServiceInterface
{
    public function paginate(?string $search, ?string $action, ?int $actorId, int $perPage): LengthAwarePaginator;

    public function availableActions(): Collection;
}
