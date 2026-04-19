<?php

namespace App\Repositories\Interfaces;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface UserRepositoryInterface
{
    public function paginateTenants(?string $search, ?string $role, int $perPage): LengthAwarePaginator;

    public function findById(int $id): ?User;

    public function countTenants(): int;

    public function signupsByDay(int $days): array;
}
