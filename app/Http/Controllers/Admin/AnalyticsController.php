<?php

namespace App\Http\Controllers\Admin;

use App\Exports\AnalyticsExport;
use App\Http\Controllers\Controller;
use App\Services\Interfaces\AnalyticsServiceInterface;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AnalyticsController extends Controller
{
    public function __construct(
        private AnalyticsServiceInterface $analyticsService,
    ) {}

    public function index(Request $request): Response
    {
        $business = auth()->user()->ownedBusiness;
        $filters = $this->filtersFromRequest($request);
        $data = $this->analyticsService->getAnalyticsData($business, $filters);

        return Inertia::render('Admin/Analytics/Index', $data);
    }

    public function export(Request $request): BinaryFileResponse
    {
        $business = auth()->user()->ownedBusiness;
        $filters = $this->filtersFromRequest($request);
        $data = $this->analyticsService->getAnalyticsData($business, $filters);

        return Excel::download(
            new AnalyticsExport($data['employee_stats']->toArray(), $data['currency_symbol']),
            'analytics.xlsx'
        );
    }

    private function filtersFromRequest(Request $request): array
    {
        $filters = [];

        $dateFrom = $request->query('date_from');
        if (is_string($dateFrom) && $dateFrom !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFrom)) {
            $filters['date_from'] = $dateFrom;
        } else {
            $filters['date_from'] = Carbon::now()->startOfMonth()->toDateString();
        }

        $dateTo = $request->query('date_to');
        if (is_string($dateTo) && $dateTo !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateTo)) {
            $filters['date_to'] = $dateTo;
        } else {
            $filters['date_to'] = Carbon::now()->endOfMonth()->toDateString();
        }

        $employeeIdRaw = $request->query('employee_id');
        if ($employeeIdRaw !== null && $employeeIdRaw !== '' && is_numeric($employeeIdRaw)) {
            $id = (int) $employeeIdRaw;
            if ($id > 0) {
                $filters['employee_id'] = $id;
            }
        }

        return $filters;
    }
}
