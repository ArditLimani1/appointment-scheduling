<?php

namespace App\Http\Controllers\Employee;

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
        $timezone = $business?->timezone ?: config('app.timezone');
        $today = now($timezone)->toDateString();

        $data = $this->dashboardService->getEmployeeDashboardData(auth()->user(), $today, $today);

        return Inertia::render('Employee/Dashboard', array_merge($data, [
            'employee_compact_mobile_appointments' => true,
        ]));
    }
}
