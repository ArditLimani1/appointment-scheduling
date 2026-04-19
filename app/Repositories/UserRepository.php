<?php

namespace App\Repositories;

use App\Enums\UserType;
use App\Models\User;
use App\Repositories\Interfaces\UserRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class UserRepository implements UserRepositoryInterface
{
    public function paginateTenants(?string $search, ?string $role, int $perPage): LengthAwarePaginator
    {
        return User::query()
            ->where('user_type', UserType::Tenant->value)
            ->with(['business:id,name,slug', 'ownedBusiness:id,name,slug,owner_id'])
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($role, fn ($q) => $q->where('role', $role))
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }

    public function findById(int $id): ?User
    {
        return User::find($id);
    }

    public function countTenants(): int
    {
        return User::where('user_type', UserType::Tenant->value)->count();
    }

    public function signupsByDay(int $days): array
    {
        $since = Carbon::now()->subDays($days);

        return User::query()
            ->where('created_at', '>=', $since)
            ->where('user_type', UserType::Tenant->value)
            ->selectRaw('DATE(created_at) as day, COUNT(*) as count')
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->map(fn ($row) => ['day' => $row->day, 'count' => (int) $row->count])
            ->all();
    }
}
