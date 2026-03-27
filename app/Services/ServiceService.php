<?php

namespace App\Services;

use App\Models\Business;
use App\Models\Service;
use App\Repositories\Interfaces\ServiceRepositoryInterface;
use App\Services\Interfaces\ServiceServiceInterface;
use Illuminate\Database\Eloquent\Collection;

class ServiceService implements ServiceServiceInterface
{
    public function __construct(
        private ServiceRepositoryInterface $serviceRepository,
    ) {}

    public function getServices(Business $business): Collection
    {
        return $this->serviceRepository->getByBusiness($business->id);
    }

    public function store(Business $business, array $data): Service
    {
        return $this->serviceRepository->create(array_merge($data, ['business_id' => $business->id]));
    }

    public function update(Business $business, Service $service, array $data): Service
    {
        abort_if($service->business_id !== $business->id, 403);

        return $this->serviceRepository->update($service, $data);
    }

    public function delete(Business $business, Service $service): void
    {
        abort_if($service->business_id !== $business->id, 403);

        $this->serviceRepository->delete($service);
    }
}
