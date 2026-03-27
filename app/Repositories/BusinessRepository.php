<?php

namespace App\Repositories;

use App\Models\Business;
use App\Repositories\Interfaces\BusinessRepositoryInterface;

class BusinessRepository implements BusinessRepositoryInterface
{
    public function findByOwnerId(int $ownerId): ?Business
    {
        return Business::where('owner_id', $ownerId)->first();
    }

    public function findActiveBySlug(string $slug): Business
    {
        return Business::where('slug', $slug)->where('is_active', true)->firstOrFail();
    }

    public function create(array $data): Business
    {
        return Business::create($data);
    }

    public function update(Business $business, array $data): Business
    {
        $business->update($data);

        return $business;
    }
}
