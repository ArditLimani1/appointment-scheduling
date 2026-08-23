<?php

namespace App\Http\Controllers\Api\V1\Employee;

use App\Http\Controllers\Controller;
use App\Services\Interfaces\DashboardServiceInterface;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        private DashboardServiceInterface $dashboardService,
    ) {}

    /**
     * Same payload as the Inertia employee dashboard; date range optional
     * (defaults to today in the business timezone).
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date_from' => ['sometimes', 'date_format:Y-m-d'],
            'date_to' => ['sometimes', 'date_format:Y-m-d'],
            'service_id' => ['sometimes', 'integer', 'min:1'],
        ]);

        $user = $request->user();
        $business = $user->panelBusiness();
        $timezone = $business?->timezone ?: config('app.timezone');
        $today = Carbon::now($timezone)->toDateString();

        $dateFrom = $validated['date_from'] ?? $today;
        $dateTo = $validated['date_to'] ?? $dateFrom;
        if ($dateFrom > $dateTo) {
            [$dateFrom, $dateTo] = [$dateTo, $dateFrom];
        }

        $data = $this->dashboardService->getEmployeeDashboardData(
            $user,
            $dateFrom,
            $dateTo,
            isset($validated['service_id']) ? (int) $validated['service_id'] : null,
        );

        return response()->json($data);
    }
}
