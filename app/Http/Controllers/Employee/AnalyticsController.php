<?php

namespace App\Http\Controllers\Employee;

use App\Exports\EmployeeAnalyticsExport;
use App\Http\Controllers\Concerns\ResolvesAnalyticsDateFilters;
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
    use ResolvesAnalyticsDateFilters;

    public function __construct(
        private EmployeeAnalyticsServiceInterface $employeeAnalyticsService,
    ) {}

    public function index(Request $request): Response
    {
        $filters = $this->analyticsFiltersFromRequest($request);
        $data = $this->employeeAnalyticsService->getAnalyticsData(auth()->user(), $filters);

        return Inertia::render('Employee/Analytics/Index', $data);
    }

    public function export(Request $request): BinaryFileResponse
    {
        $filters = $this->analyticsFiltersFromRequest($request);
        $data = $this->employeeAnalyticsService->getAnalyticsData(auth()->user(), $filters);

        return Excel::download(
            new EmployeeAnalyticsExport(
                $data['service_stats'],
                $data['currency_symbol'],
            ),
            __('exports.files.employee_analytics').'-'.$filters['date_from'].'_'.$filters['date_to'].'.xlsx'
        );
    }

    public function exportPdf(Request $request): HttpResponse
    {
        $filters = $this->analyticsFiltersFromRequest($request);
        $data = $this->employeeAnalyticsService->getAnalyticsData(auth()->user(), $filters);

        $user = auth()->user();
        $business = $user->business;

        $pdf = Pdf::loadView('exports.employee-analytics-pdf', [
            'employeeName' => $user->name,
            'businessName' => $business?->name ?? '',
            'generatedAt' => Carbon::now()->locale(app()->getLocale())->translatedFormat('d F Y, H:i'),
            'dateFrom' => $filters['date_from'],
            'dateTo' => $filters['date_to'],
            'serviceFilter' => $data['selected_service_name'] ?? __('exports.common.all_services'),
            'summary' => $data['summary'],
            'serviceStats' => $data['service_stats'],
            'monthlyPerformance' => $data['monthly_performance'],
            'currencySymbol' => $data['currency_symbol'],
        ])->setPaper('a4', 'landscape');

        return $pdf->download(
            __('exports.files.employee_analytics').'-'.$filters['date_from'].'_'.$filters['date_to'].'.pdf'
        );
    }

}
