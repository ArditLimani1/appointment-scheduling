<?php

namespace App\Services;

use App\Models\Business;
use App\Models\SharedResource;
use App\Repositories\Interfaces\SharedResourceRepositoryInterface;
use App\Services\Interfaces\SharedResourceServiceInterface;
use Illuminate\Database\Eloquent\Collection;

class SharedResourceService implements SharedResourceServiceInterface
{
    public function __construct(
        private SharedResourceRepositoryInterface $sharedResourceRepository,
    ) {}

    public function getResources(Business $business): Collection
    {
        return $this->sharedResourceRepository->getByBusiness($business->id);
    }

    public function store(Business $business, array $data): SharedResource
    {
        return $this->sharedResourceRepository->create(array_merge($data, [
            'business_id' => $business->id,
        ]));
    }

    public function update(Business $business, SharedResource $resource, array $data): SharedResource
    {
        abort_if($resource->business_id !== $business->id, 403);

        return $this->sharedResourceRepository->update($resource, $data);
    }

    public function delete(Business $business, SharedResource $resource): void
    {
        abort_if($resource->business_id !== $business->id, 403);
        if ($this->sharedResourceRepository->isReferencedByAppointments($resource)) {
            abort(422, __('errors.shared_resource.delete_blocked'));
        }

        $this->sharedResourceRepository->delete($resource);
    }
}
