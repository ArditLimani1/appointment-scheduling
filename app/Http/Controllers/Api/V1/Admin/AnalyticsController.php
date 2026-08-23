<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ResolvesAdminAnalyticsFilters;
use App\Http\Controllers\Controller;
use App\Services\Interfaces\AnalyticsServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    use ResolvesAdminAnalyticsFilters;

    public function __construct(
        private AnalyticsServiceInterface $analyticsService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $business = $request->user()->panelBusiness();
        abort_unless($business, 403);

        $filters = $this->adminAnalyticsFiltersFromRequest($request);

        return response()->json($this->analyticsService->getAnalyticsData($business, $filters));
    }
}
