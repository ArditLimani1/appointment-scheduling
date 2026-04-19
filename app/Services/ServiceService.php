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
        $resources = $data['resources'] ?? null;
        unset($data['resources']);

        $service = $this->serviceRepository->create(array_merge($data, ['business_id' => $business->id]));

        if ($business->uses_shared_resources && is_array($resources)) {
            $this->syncSharedResources($service, $resources);
        } elseif (! $business->uses_shared_resources) {
            $this->syncSharedResources($service, []);
        }

        return $service->load('sharedResources');
    }

    public function update(Business $business, Service $service, array $data): Service
    {
        abort_if($service->business_id !== $business->id, 403);

        $resources = null;
        if (array_key_exists('resources', $data)) {
            $resources = $data['resources'];
            unset($data['resources']);
        }

        $this->serviceRepository->update($service, $data);

        if ($business->uses_shared_resources && is_array($resources)) {
            $this->syncSharedResources($service, $resources);
        } elseif (! $business->uses_shared_resources) {
            $this->syncSharedResources($service, []);
        }

        return $service->fresh()->load('sharedResources');
    }

    public function delete(Business $business, Service $service): void
    {
        abort_if($service->business_id !== $business->id, 403);

        $this->serviceRepository->delete($service);
    }

    /**
     * @param  list<array{resource_id: int, quantity: int}>  $rows
     */
    private function syncSharedResources(Service $service, array $rows): void
    {
        $sync = [];
        foreach ($rows as $row) {
            $rid = (int) $row['resource_id'];
            $sync[$rid] = ['quantity' => (int) $row['quantity']];
        }
        $service->sharedResources()->sync($sync);
    }
}
