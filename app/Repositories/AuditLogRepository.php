<?php

namespace App\Repositories;

use App\Models\AuditLog;
use App\Repositories\Interfaces\AuditLogRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;

class AuditLogRepository implements AuditLogRepositoryInterface
{
    public function create(array $data): AuditLog
    {
        return AuditLog::create($data);
    }

    public function paginateWithFilters(?string $search, ?string $action, ?int $actorId, int $perPage): LengthAwarePaginator
    {
        return AuditLog::query()
            ->with('actor:id,name,email')
            ->when($search, function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('action', 'like', "%{$search}%")
                        ->orWhere('target_label', 'like', "%{$search}%")
                        ->orWhere('actor_email', 'like', "%{$search}%");
                });
            })
            ->when($action, fn ($q) => $q->where('action', $action))
            ->when($actorId, fn ($q) => $q->where('actor_id', $actorId))
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }

    public function distinctActions(): SupportCollection
    {
        return AuditLog::query()
            ->select('action')
            ->distinct()
            ->orderBy('action')
            ->pluck('action');
    }

    public function recent(int $limit): Collection
    {
        return AuditLog::query()
            ->with('actor:id,name,email')
            ->latest()
            ->take($limit)
            ->get();
    }

    public function count(): int
    {
        return AuditLog::count();
    }
}
