<?php

namespace App\Services\Interfaces;

use App\Models\Business;
use App\Models\User;

interface DashboardServiceInterface
{
    public function getAdminDashboardData(Business $business): array;

    public function getEmployeeDashboardData(User $user, string $date): array;
}
