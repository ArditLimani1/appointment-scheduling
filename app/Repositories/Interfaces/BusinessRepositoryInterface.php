<?php

namespace App\Repositories\Interfaces;

use App\Models\Business;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface BusinessRepositoryInterface
{
    public function findByOwnerId(int $ownerId): ?Business;

    public function findActiveBySlug(string $slug): Business;

    public function create(array $data): Business;

    public function update(Business $business, array $data): Business;

    public function delete(Business $business): void;

    public function paginateForAdmin(?string $search, ?string $status, int $perPage): LengthAwarePaginator;

    public function loadDetails(Business $business): Business;

    public function employeesForAdmin(Business $business): Collection;

    public function statsFor(Business $business): array;

    public function recentForDashboard(int $limit): Collection;

    public function countAll(): int;

    public function countActive(): int;

    public function countSuspended(): int;
}
