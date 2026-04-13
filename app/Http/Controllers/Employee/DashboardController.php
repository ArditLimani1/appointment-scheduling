<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Services\Interfaces\DashboardServiceInterface;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private DashboardServiceInterface $dashboardService,
    ) {}

    public function index(): Response
    {
        $today = Carbon::today()->toDateString();

        $data = $this->dashboardService->getEmployeeDashboardData(auth()->user(), $today, $today);

        return Inertia::render('Employee/Dashboard', array_merge($data, [
            'employee_compact_mobile_appointments' => true,
        ]));
    }
}
