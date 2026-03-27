<?php

namespace App\Repositories;

use App\Models\Service;
use App\Repositories\Interfaces\ServiceRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class ServiceRepository implements ServiceRepositoryInterface
{
    public function getByBusiness(int $businessId): Collection
    {
        return Service::where('business_id', $businessId)->get();
    }

    public function getActiveByBusiness(int $businessId): Collection
    {
        return Service::where('business_id', $businessId)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();
    }

    public function countByBusiness(int $businessId): int
    {
        return Service::where('business_id', $businessId)->count();
    }

    public function countActiveByBusiness(int $businessId): int
    {
        return Service::where('business_id', $businessId)
            ->where('is_active', true)
            ->count();
    }

    public function findById(int $id): ?Service
    {
        return Service::find($id);
    }

    public function create(array $data): Service
    {
        return Service::create($data);
    }

    public function update(Service $service, array $data): Service
    {
        $service->update($data);

        return $service;
    }

    public function delete(Service $service): void
    {
        $service->delete();
    }
}
