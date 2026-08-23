<?php

namespace App\Http\Controllers\Admin;

use App\Exports\AnalyticsExport;
use App\Http\Controllers\Concerns\ResolvesAdminAnalyticsFilters;
use App\Http\Controllers\Controller;
use App\Services\Interfaces\AnalyticsServiceInterface;
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
    use ResolvesAdminAnalyticsFilters;

    public function __construct(
        private AnalyticsServiceInterface $analyticsService,
    ) {}

    public function index(Request $request): Response
    {
        $business = auth()->user()->panelBusiness();
        abort_unless($business, 403);
        $filters = $this->adminAnalyticsFiltersFromRequest($request);
        $data = $this->analyticsService->getAnalyticsData($business, $filters);

        return Inertia::render('Admin/Analytics/Index', $data);
    }

    public function export(Request $request): BinaryFileResponse
    {
        $business = auth()->user()->panelBusiness();
        abort_unless($business, 403);
        $filters = $this->adminAnalyticsFiltersFromRequest($request);
        $data = $this->analyticsService->getAnalyticsData($business, $filters);

        return Excel::download(
            new AnalyticsExport($data['employee_stats']->toArray(), $data['currency_symbol']),
            __('exports.files.analytics').'.xlsx'
        );
    }

    public function exportPdf(Request $request): HttpResponse
    {
        $business = auth()->user()->panelBusiness();
        abort_unless($business, 403);

        $filters = $this->adminAnalyticsFiltersFromRequest($request);
        $data = $this->analyticsService->getAnalyticsData($business, $filters);
        $stats = $data['employee_stats']->toArray();
        $currencySymbol = $data['currency_symbol'] ?? '€';

        // Resolve employee name for the filter label
        $employeeFilter = null;
        if (! empty($filters['legacy_employee_name'])) {
            $employeeFilter = $filters['legacy_employee_name'];
        } elseif (! empty($filters['employee_id'])) {
            $employee = $business->employees()->find($filters['employee_id']);
            $employeeFilter = $employee?->name;
        }

        $totalCancelled = (int) array_sum(array_column($stats, 'cancelled_count'));
        $totalPending = (int) array_sum(array_column($stats, 'pending_count'));
        $totalConfirmed = (int) array_sum(array_column($stats, 'confirmed_count'));
        $totalRevenue = (float) array_sum(array_column($stats, 'revenue'));

        $pdf = Pdf::loadView('exports.analytics-pdf', [
            'businessName' => $business->name,
            'generatedAt' => Carbon::now()->locale(app()->getLocale())->translatedFormat('d F Y, H:i'),
            'dateFrom' => $filters['date_from'],
            'dateTo' => $filters['date_to'],
            'employeeFilter' => $employeeFilter,
            'employeeStats' => $stats,
            'monthlyPerformance' => $data['monthly_performance'],
            'currencySymbol' => $currencySymbol,
            'totalAppointments' => $data['total_appointments'],
            'totalConfirmed' => $totalConfirmed,
            'totalCancelled' => $totalCancelled,
            'totalPending' => $totalPending,
            'totalRevenue' => $totalRevenue,
        ])->setPaper('a4', 'landscape');

        return $pdf->download(
            __('exports.files.analytics').'-'.$filters['date_from'].'_'.$filters['date_to'].'.pdf'
        );
    }
}
