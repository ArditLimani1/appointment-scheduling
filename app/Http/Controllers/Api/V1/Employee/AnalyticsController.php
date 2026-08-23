<?php

namespace App\Http\Controllers\Api\V1\Employee;

use App\Http\Controllers\Concerns\ResolvesAnalyticsDateFilters;
use App\Http\Controllers\Controller;
use App\Services\Interfaces\EmployeeAnalyticsServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    use ResolvesAnalyticsDateFilters;

    public function __construct(
        private EmployeeAnalyticsServiceInterface $employeeAnalyticsService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $this->analyticsFiltersFromRequest($request);

        return response()->json(
            $this->employeeAnalyticsService->getAnalyticsData($request->user(), $filters)
        );
    }
}
