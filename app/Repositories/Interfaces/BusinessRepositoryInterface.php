<?php

namespace App\Repositories\Interfaces;

use App\Models\Business;

interface BusinessRepositoryInterface
{
    public function findByOwnerId(int $ownerId): ?Business;

    public function findActiveBySlug(string $slug): Business;

    public function create(array $data): Business;

    public function update(Business $business, array $data): Business;
}
