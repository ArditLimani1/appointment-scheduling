<?php

namespace App\Services;

use App\Models\Business;
use App\Models\User;
use App\Repositories\Interfaces\BusinessRepositoryInterface;
use App\Services\Interfaces\BusinessServiceInterface;
use App\Support\ClientIdentification;
use Illuminate\Validation\ValidationException;

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
            'client_identifier_type' => ClientIdentification::resolve(null),
            'allow_employee_service_edit' => true,
            'uses_shared_resources' => false,
            'auto_confirm_appointments' => false,
            'reminders_enabled' => false,
            'reminder_time' => '08:00',
        ]);

        $showOwnerStaffToggle = $user->isAdmin()
            && $business->exists
            && (int) $business->owner_id === (int) $user->id;

        return [
            'settings' => $business,
            'owner_email' => $user->email,
            'show_owner_staff_toggle' => $showOwnerStaffToggle,
            'owner_also_works_as_staff' => $showOwnerStaffToggle && $user->also_works_as_staff,
            'has_hired_employees' => $business->exists && $business->hasHiredEmployees(),
        ];
    }

    public function syncTeamMode(User $user, Business $business, ?bool $singleEmployeeMode, ?bool $ownerWorksAsStaff): void
    {
        if (! $user->isOwnerOf($business)) {
            return;
        }

        if ($singleEmployeeMode === true) {
            if ($business->hasHiredEmployees()) {
                throw ValidationException::withMessages([
                    'single_employee_mode' => __('errors.business.single_employee_requires_solo_owner'),
                ]);
            }

            $business->forceFill(['single_employee_mode' => true])->save();
            $user->syncAlsoWorksAsStaff($business, true);

            return;
        }

        if ($singleEmployeeMode === false) {
            $business->forceFill(['single_employee_mode' => false])->save();
        }

        $business->refresh();

        if ($ownerWorksAsStaff === null) {
            return;
        }

        if ($business->single_employee_mode && $ownerWorksAsStaff === false) {
            throw ValidationException::withMessages([
                'owner_also_works_as_staff' => __('errors.business.owner_staff_locked_in_single_employee'),
            ]);
        }

        $user->syncAlsoWorksAsStaff($business, $ownerWorksAsStaff);
    }

    public function updateSettings(User $user, array $data): Business
    {
        if (! ClientIdentification::whatsappEnabled()) {
            $data['client_identifier_type'] = 'email';
        }

        $business = $user->panelBusiness();

        if ($business) {
            return $this->businessRepository->update($business, $data);
        }

        abort_unless($user->isAdmin(), 403);

        return $this->businessRepository->create(array_merge($data, ['owner_id' => $user->id]));
    }
}
