<?php

namespace App\Repositories;

use App\Models\Business;
use App\Repositories\Interfaces\BusinessRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class BusinessRepository implements BusinessRepositoryInterface
{
    public function findByOwnerId(int $ownerId): ?Business
    {
        return Business::where('owner_id', $ownerId)->first();
    }

    public function findActiveBySlug(string $slug): Business
    {
        return Business::where('slug', $slug)->where('is_active', true)->firstOrFail();
    }

    public function create(array $data): Business
    {
        return Business::create($data);
    }

    public function update(Business $business, array $data): Business
    {
        $business->update($data);

        return $business;
    }

    public function delete(Business $business): void
    {
        $business->delete();
    }

    public function paginateForAdmin(?string $search, ?string $status, int $perPage): LengthAwarePaginator
    {
        return Business::query()
            ->with(['owner:id,name,email', 'businessType:id,name'])
            ->withCount(['employees', 'appointments'])
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($status === 'active', fn ($q) => $q->where('is_active', true))
            ->when($status === 'suspended', fn ($q) => $q->where('is_active', false))
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }

    public function loadDetails(Business $business): Business
    {
        return $business->load(['owner:id,name,email', 'businessType:id,name']);
    }

    public function employeesForAdmin(Business $business): Collection
    {
        return $business->employees()
            ->with('businessRole:id,name')
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'phone', 'title', 'role', 'is_active', 'business_role_id', 'also_works_as_staff', 'created_at']);
    }

    public function statsFor(Business $business): array
    {
        return [
            'employees' => $business->employees()->count(),
            'active_employees' => $business->employees()->where('is_active', true)->count(),
            'services' => $business->services()->count(),
            'appointments' => $business->appointments()->count(),
        ];
    }

    public function recentForDashboard(int $limit): Collection
    {
        return Business::with('owner:id,name,email')
            ->latest()
            ->take($limit)
            ->get(['id', 'name', 'slug', 'owner_id', 'is_active', 'created_at']);
    }

    public function countAll(): int
    {
        return Business::count();
    }

    public function countActive(): int
    {
        return Business::where('is_active', true)->count();
    }

    public function countSuspended(): int
    {
        return Business::where('is_active', false)->count();
    }
}
