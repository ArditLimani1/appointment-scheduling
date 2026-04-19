<?php

namespace App\Repositories\Interfaces;

use App\Models\AuditLog;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;

interface AuditLogRepositoryInterface
{
    public function create(array $data): AuditLog;

    public function paginateWithFilters(?string $search, ?string $action, ?int $actorId, int $perPage): LengthAwarePaginator;

    public function distinctActions(): SupportCollection;

    public function recent(int $limit): Collection;

    public function count(): int;
}
