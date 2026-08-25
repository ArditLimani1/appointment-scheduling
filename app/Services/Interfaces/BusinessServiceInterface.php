<?php

namespace App\Services\Interfaces;

use App\Models\Business;
use App\Models\User;

interface BusinessServiceInterface
{
    public function getSettingsForUser(User $user): array;

    public function updateSettings(User $user, array $data): Business;

    public function syncTeamMode(User $user, Business $business, ?bool $singleEmployeeMode, ?bool $ownerWorksAsStaff): void;
}
