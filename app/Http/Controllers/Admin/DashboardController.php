<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Interfaces\DashboardServiceInterface;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private DashboardServiceInterface $dashboardService,
    ) {}

    public function index(): Response
    {
        $business = auth()->user()->ownedBusiness;
        $data = $this->dashboardService->getAdminDashboardData($business);

        return Inertia::render('Admin/Dashboard', $data);
    }
}
