<?php

namespace App\Services\Interfaces;

use App\Models\Business;
use App\Models\Service;
use Illuminate\Database\Eloquent\Collection;

interface ServiceServiceInterface
{
    public function getServices(Business $business): Collection;

    public function store(Business $business, array $data): Service;

    public function update(Business $business, Service $service, array $data): Service;

    public function delete(Business $business, Service $service): void;
}
