<?php

namespace App\Services\Interfaces\SuperAdmin;

use App\Models\Business;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface BusinessAdministrationServiceInterface
{
    public function paginate(?string $search, ?string $status, int $perPage): LengthAwarePaginator;

    public function detailsFor(Business $business): array;

    public function update(Business $business, array $data): Business;

    public function toggleSuspension(Business $business): Business;

    public function delete(Business $business): string;
}
