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
        $today = Carbon::today()->toDateString();

        $from = $this->parseDashboardDate($request->input('date_from'));
        $to = $this->parseDashboardDate($request->input('date_to'));

        if ($request->filled('date') && $from === null && $to === null) {
            $legacy = $this->parseDashboardDate($request->input('date'));
            if ($legacy !== null) {
                $from = $legacy;
                $to = $legacy;
            }
        }

        $from ??= $today;
        $to ??= $today;

        if ($from > $to) {
            $to = $from;
        }

        $data = $this->dashboardService->getEmployeeDashboardData(auth()->user(), $from, $to);

        return Inertia::render('Employee/Dashboard', $data);
    }

    private function parseDashboardDate(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $value = (string) $value;

        foreach (['Y-m-d', 'd.m.Y'] as $format) {
            try {
                return Carbon::createFromFormat($format, $value)->toDateString();
            } catch (\Throwable) {
            }
        }

        return null;
    }
}
