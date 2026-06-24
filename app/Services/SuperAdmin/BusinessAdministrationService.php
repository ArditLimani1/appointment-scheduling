<?php

namespace App\Services\SuperAdmin;

use App\Models\Business;
use App\Repositories\Interfaces\BusinessRepositoryInterface;
use App\Repositories\Interfaces\BusinessTypeRepositoryInterface;
use App\Services\AuditLogger;
use App\Services\Interfaces\SuperAdmin\BusinessAdministrationServiceInterface;
use App\Support\ClientIdentification;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class BusinessAdministrationService implements BusinessAdministrationServiceInterface
{
    public function __construct(
        private BusinessRepositoryInterface $businesses,
        private BusinessTypeRepositoryInterface $businessTypes,
    ) {}

    public function paginate(?string $search, ?string $status, int $perPage): LengthAwarePaginator
    {
        return $this->businesses->paginateForAdmin($search, $status, $perPage);
    }

    public function detailsFor(Business $business): array
    {
        $business = $this->businesses->loadDetails($business);

        return [
            'business' => $business,
            'employees' => $this->businesses->employeesForAdmin($business),
            'stats' => $this->businesses->statsFor($business),
            'businessTypes' => $this->businessTypes->listActiveForSelect(),
        ];
    }

    public function update(Business $business, array $data): Business
    {
        if (! ClientIdentification::whatsappEnabled()) {
            $data['client_identifier_type'] = 'email';
        }

        $business = $this->businesses->update($business, $data);

        AuditLogger::log('business.updated', $business, ['slug' => $business->slug], $business->name);

        return $business;
    }

    public function toggleSuspension(Business $business): Business
    {
        $business = $this->businesses->update($business, ['is_active' => ! $business->is_active]);

        AuditLogger::log(
            $business->is_active ? 'business.activated' : 'business.suspended',
            $business,
            ['slug' => $business->slug],
            $business->name,
        );

        return $business;
    }

    public function delete(Business $business): string
    {
        $label = $business->name;
        $slug = $business->slug;
        $businessId = $business->id;

        $this->businesses->delete($business);

        AuditLogger::log(
            'business.deleted',
            null,
            ['slug' => $slug, 'business_id' => $businessId],
            $label,
        );

        return $label;
    }
}
