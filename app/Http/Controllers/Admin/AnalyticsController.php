<?php

namespace App\Http\Controllers\Admin;

use App\Exports\AnalyticsExport;
use App\Http\Controllers\Controller;
use App\Services\Interfaces\AnalyticsServiceInterface;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Str;
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
        $business = auth()->user()->panelBusiness();
        abort_unless($business, 403);
        $filters = $this->filtersFromRequest($request);
        $data = $this->analyticsService->getAnalyticsData($business, $filters);

        return Inertia::render('Admin/Analytics/Index', $data);
    }

    public function export(Request $request): BinaryFileResponse
    {
        $business = auth()->user()->panelBusiness();
        abort_unless($business, 403);
        $filters = $this->filtersFromRequest($request);
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

        $filters = $this->filtersFromRequest($request);
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

        $totalCancelled = (int) ($data['cancelled_count'] ?? 0);
        $totalPending = (int) ($data['pending_count'] ?? 0);
        $totalConfirmed = (int) ($data['confirmed_count'] ?? 0);
        $totalRevenue = (float) ($data['total_revenue'] ?? 0);

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

        if ($filters['date_from'] > $filters['date_to']) {
            [$filters['date_from'], $filters['date_to']] = [$filters['date_to'], $filters['date_from']];
        }

        $employeeFromQueryParsed = false;
        $employeeRaw = $request->query('employee');
        if (is_string($employeeRaw) && $employeeRaw !== '') {
            $employeeFromQueryParsed = true;
            if (str_starts_with($employeeRaw, 'legacy:')) {
                $decoded = rawurldecode(Str::after($employeeRaw, 'legacy:'));
                if ($decoded !== '') {
                    $filters['legacy_employee_name'] = $decoded;
                }
            } elseif (ctype_digit($employeeRaw)) {
                $id = (int) $employeeRaw;
                if ($id > 0) {
                    $filters['employee_id'] = $id;
                }
            }
        }

        $employeeIdRaw = $request->query('employee_id');
        if (! $employeeFromQueryParsed && $employeeIdRaw !== null && $employeeIdRaw !== '' && is_numeric($employeeIdRaw)) {
            $id = (int) $employeeIdRaw;
            if ($id > 0) {
                $filters['employee_id'] = $id;
            }
        }

        return $filters;
    }
}
