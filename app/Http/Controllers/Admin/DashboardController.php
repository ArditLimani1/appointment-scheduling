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
        $business = auth()->user()->panelBusiness();
        abort_unless($business, 403);
        $data = array_merge($this->dashboardService->getAdminDashboardData($business), [
            'admin_compact_mobile_appointments' => true,
        ]);

        return Inertia::render('Admin/Dashboard', $data);
    }
}
