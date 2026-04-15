<?php

namespace App\Services\Interfaces;

use App\Models\Business;
use App\Models\SharedResource;
use Illuminate\Database\Eloquent\Collection;

interface SharedResourceServiceInterface
{
    public function getResources(Business $business): Collection;

    public function store(Business $business, array $data): SharedResource;

    public function update(Business $business, SharedResource $resource, array $data): SharedResource;

    public function delete(Business $business, SharedResource $resource): void;
}
