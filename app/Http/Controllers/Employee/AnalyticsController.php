<?php

namespace App\Http\Controllers\Employee;

use App\Exports\EmployeeAnalyticsExport;
use App\Http\Controllers\Controller;
use App\Services\Interfaces\EmployeeAnalyticsServiceInterface;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AnalyticsController extends Controller
{
    public function __construct(
        private EmployeeAnalyticsServiceInterface $employeeAnalyticsService,
    ) {}

    public function index(Request $request): Response
    {
        $filters = $this->filtersFromRequest($request);
        $data = $this->employeeAnalyticsService->getAnalyticsData(auth()->user(), $filters);

        return Inertia::render('Employee/Analytics/Index', $data);
    }

    public function export(Request $request): BinaryFileResponse
    {
        $filters = $this->filtersFromRequest($request);
        $data = $this->employeeAnalyticsService->getAnalyticsData(auth()->user(), $filters);

        return Excel::download(
            new EmployeeAnalyticsExport(
                $data['service_stats'],
                $data['currency_symbol'],
            ),
            'employee-analytics-'.$filters['date_from'].'_'.$filters['date_to'].'.xlsx'
        );
    }

    public function exportPdf(Request $request): HttpResponse
    {
        $filters = $this->filtersFromRequest($request);
        $data = $this->employeeAnalyticsService->getAnalyticsData(auth()->user(), $filters);

        $user = auth()->user();
        $business = $user->business;

        $pdf = Pdf::loadView('exports.employee-analytics-pdf', [
            'employeeName' => $user->name,
            'businessName' => $business?->name ?? '',
            'generatedAt' => Carbon::now()->format('d M Y, H:i'),
            'dateFrom' => $filters['date_from'],
            'dateTo' => $filters['date_to'],
            'serviceFilter' => $data['selected_service_name'] ?? 'All services',
            'summary' => $data['summary'],
            'serviceStats' => $data['service_stats'],
            'monthlyPerformance' => $data['monthly_performance'],
            'currencySymbol' => $data['currency_symbol'],
        ])->setPaper('a4', 'landscape');

        return $pdf->download('employee-analytics-'.$filters['date_from'].'_'.$filters['date_to'].'.pdf');
    }

    /**
     * @return array{date_from: string, date_to: string, service_id: mixed}
     */
    private function filtersFromRequest(Request $request): array
    {
        $dateFrom = $request->query('date_from');
        if (! is_string($dateFrom) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateFrom)) {
            $dateFrom = Carbon::now()->startOfMonth()->toDateString();
        }

        $dateTo = $request->query('date_to');
        if (! is_string($dateTo) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateTo)) {
            $dateTo = Carbon::now()->endOfMonth()->toDateString();
        }

        if ($dateFrom > $dateTo) {
            [$dateFrom, $dateTo] = [$dateTo, $dateFrom];
        }

        return [
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'service_id' => $request->query('service_id'),
        ];
    }
}
