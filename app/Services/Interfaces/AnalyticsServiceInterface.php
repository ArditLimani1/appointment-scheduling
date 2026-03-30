<?php

namespace App\Services\Interfaces;

use App\Models\Business;

interface AnalyticsServiceInterface
{
    public function getAnalyticsData(Business $business, array $filters): array;
}
