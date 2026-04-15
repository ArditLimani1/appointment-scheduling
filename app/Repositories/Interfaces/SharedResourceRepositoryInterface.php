<?php

namespace App\Repositories\Interfaces;

use App\Models\SharedResource;
use Illuminate\Database\Eloquent\Collection;

interface SharedResourceRepositoryInterface
{
    public function getByBusiness(int $businessId): Collection;

    public function findById(int $id): ?SharedResource;

    public function create(array $data): SharedResource;

    public function update(SharedResource $resource, array $data): SharedResource;

    public function delete(SharedResource $resource): void;

    public function isReferencedByAppointments(SharedResource $resource): bool;
}
