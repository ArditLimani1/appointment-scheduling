<?php

namespace App\Services\Interfaces;

use App\Models\User;

interface EmployeeAnalyticsServiceInterface
{
    /**
     * @return array<string, mixed>
     */
    public function getAnalyticsData(User $user, array $filters): array;
}
