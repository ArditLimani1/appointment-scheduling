<?php

namespace App\Services;

use App\Models\Business;
use App\Models\User;
use App\Repositories\Interfaces\BusinessRepositoryInterface;
use App\Services\Interfaces\BusinessServiceInterface;

class BusinessService implements BusinessServiceInterface
{
    public function __construct(
        private BusinessRepositoryInterface $businessRepository,
    ) {}

    public function getSettingsForUser(User $user): array
    {
        $business = $user->panelBusiness() ?? new Business([
            'name' => '',
            'slug' => '',
            'timezone' => 'UTC',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'slot_duration' => 30,
            'min_booking_notice' => 120,
            'max_booking_window' => 30,
            'services_enabled' => true,
            'client_identifier_type' => 'phone',
        ]);

        $showOwnerStaffToggle = $user->isAdmin()
            && $business->exists
            && (int) $business->owner_id === (int) $user->id;

        return [
            'settings' => $business,
            'owner_email' => $user->email,
            'show_owner_staff_toggle' => $showOwnerStaffToggle,
            'owner_also_works_as_staff' => $showOwnerStaffToggle && $user->also_works_as_staff,
        ];
    }

    public function updateSettings(User $user, array $data): Business
    {
        $business = $user->panelBusiness();

        if ($business) {
            return $this->businessRepository->update($business, $data);
        }

        abort_unless($user->isAdmin(), 403);

        return $this->businessRepository->create(array_merge($data, ['owner_id' => $user->id]));
    }
}
