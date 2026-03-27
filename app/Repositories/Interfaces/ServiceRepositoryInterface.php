<?php

namespace App\Repositories\Interfaces;

use App\Models\Service;
use Illuminate\Database\Eloquent\Collection;

interface ServiceRepositoryInterface
{
    public function getByBusiness(int $businessId): Collection;

    public function getActiveByBusiness(int $businessId): Collection;

    public function countByBusiness(int $businessId): int;

    public function countActiveByBusiness(int $businessId): int;

    public function findById(int $id): ?Service;

    public function create(array $data): Service;

    public function update(Service $service, array $data): Service;

    public function delete(Service $service): void;
}
