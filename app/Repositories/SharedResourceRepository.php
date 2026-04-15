<?php

namespace App\Repositories;

use App\Models\SharedResource;
use App\Repositories\Interfaces\SharedResourceRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class SharedResourceRepository implements SharedResourceRepositoryInterface
{
    public function getByBusiness(int $businessId): Collection
    {
        return SharedResource::where('business_id', $businessId)->orderBy('name')->get();
    }

    public function findById(int $id): ?SharedResource
    {
        return SharedResource::find($id);
    }

    public function create(array $data): SharedResource
    {
        return SharedResource::create($data);
    }

    public function update(SharedResource $resource, array $data): SharedResource
    {
        $resource->update($data);

        return $resource;
    }

    public function delete(SharedResource $resource): void
    {
        $resource->delete();
    }

    public function isReferencedByAppointments(SharedResource $resource): bool
    {
        return DB::table('appointment_shared_resources')
            ->where('shared_resource_id', $resource->id)
            ->exists();
    }
}
