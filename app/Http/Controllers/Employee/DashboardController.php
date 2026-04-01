<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Services\Interfaces\DashboardServiceInterface;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private DashboardServiceInterface $dashboardService,
    ) {}

    public function index(Request $request): Response
    {
        $inputDate = $request->input('date');

        try {
            $date = $inputDate
                ? (
                    Carbon::createFromFormat('d.m.Y', $inputDate)->toDateString()
                    ?? Carbon::createFromFormat('Y-m-d', $inputDate)->toDateString()
                )
                : Carbon::today()->toDateString();
        } catch (\Throwable) {
            try {
                $date = $inputDate
                    ? Carbon::createFromFormat('Y-m-d', $inputDate)->toDateString()
                    : Carbon::today()->toDateString();
            } catch (\Throwable) {
                $date = Carbon::today()->toDateString();
            }
        }

        $data = $this->dashboardService->getEmployeeDashboardData(auth()->user(), $date);

        return Inertia::render('Employee/Dashboard', $data);
    }
}
