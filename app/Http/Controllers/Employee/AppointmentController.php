<?php

namespace App\Http\Controllers\Employee;

use App\Enums\AppointmentStatus;
use App\Exports\EmployeeAppointmentsExport;
use App\Http\Controllers\Concerns\ResolvesAppointmentCalendarQuery;
use App\Http\Controllers\Controller;
use App\Http\Requests\Employee\UpdateAppointmentRescheduleRequest;
use App\Http\Requests\Employee\UpdateAppointmentStatusRequest;
use App\Models\Appointment;
use App\Models\Service;
use App\Models\User;
use App\Services\Interfaces\AppointmentServiceInterface;
use App\Services\Interfaces\BookingServiceInterface;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AppointmentController extends Controller
{
    use ResolvesAppointmentCalendarQuery;

    public function __construct(
        private AppointmentServiceInterface $appointmentService,
        private BookingServiceInterface $bookingService,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $business = $user->panelBusiness();
        abort_unless($business, 403);

        $filters = $this->employeeAppointmentsFiltersFromRequest($request, $user);
        $data = $this->appointmentService->getFiltered($business, $filters);

        return Inertia::render('Employee/Appointments/Index', array_merge($data, [
            'employee_compact_mobile_appointments' => true,
        ]));
    }

    public function export(Request $request): BinaryFileResponse
    {
        $user = $request->user();
        $business = $user->panelBusiness();
        abort_unless($business, 403);
        $filters = $this->employeeAppointmentsFiltersFromRequest($request, $user);
        $exportFilters = array_merge($filters, ['business_id' => $business->id]);

        return Excel::download(new EmployeeAppointmentsExport($exportFilters), 'my-appointments.xlsx');
    }

    public function exportPdf(Request $request): HttpResponse
    {
        $user = $request->user();
        $business = $user->panelBusiness();
        abort_unless($business, 403);

        $filters = $this->employeeAppointmentsFiltersFromRequest($request, $user);

        $query = Appointment::query()
            ->with(['employee', 'service'])
            ->where('business_id', $business->id)
            ->where('employee_id', (int) $user->id);

        if (! empty($filters['date_from'])) {
            $query->whereDate('date', '>=', $filters['date_from']);
        }
        if (! empty($filters['date_to'])) {
            $query->whereDate('date', '<=', $filters['date_to']);
        }
        if (! empty($filters['statuses']) && is_array($filters['statuses'])) {
            $cases = array_values(array_filter(array_map(
                fn ($s) => AppointmentStatus::tryFrom((string) $s),
                $filters['statuses'],
            )));
            if ($cases !== []) {
                $query->whereIn('status', $cases);
            }
        }
        if (! empty($filters['service_id'])) {
            $query->where('service_id', (int) $filters['service_id']);
        }

        if (! empty($filters['search']) && is_string($filters['search'])) {
            $term = trim($filters['search']);
            if ($term !== '') {
                $like = '%'.addcslashes($term, '%_\\').'%';
                $query->where(function ($q) use ($like) {
                    $q->where('client_first_name', 'like', $like)
                        ->orWhere('client_last_name', 'like', $like);
                });
            }
        }

        $appointments = $query->latest('date')->latest('start_time')->get();

        $currencySymbol = $business->currency_symbol ?? '€';

        $confirmedCount = $appointments->filter(fn ($a) => $a->status->value === 'confirmed')->count();
        $pendingCount = $appointments->filter(fn ($a) => $a->status->value === 'pending')->count();
        $cancelledCount = $appointments->filter(fn ($a) => $a->status->value === 'cancelled')->count();
        $totalRevenue = $appointments->filter(fn ($a) => $a->status->value === 'confirmed')
            ->sum(fn ($a) => (float) $a->price);

        $serviceFilter = null;
        if (! empty($filters['service_id'])) {
            $serviceFilter = Service::query()->whereKey($filters['service_id'])->value('name');
        }

        $pdf = Pdf::loadView('exports.employee-appointments-pdf', [
            'businessName' => $business->name,
            'employeeName' => $user->name,
            'generatedAt' => Carbon::now()->format('d M Y, H:i'),
            'dateFrom' => $filters['date_from'],
            'dateTo' => $filters['date_to'],
            'serviceFilter' => $serviceFilter,
            'statusFilter' => ! empty($filters['statuses']) && is_array($filters['statuses'])
                ? implode(', ', array_map(fn ($s) => ucfirst((string) $s), $filters['statuses']))
                : null,
            'appointments' => $appointments,
            'totalCount' => $appointments->count(),
            'confirmedCount' => $confirmedCount,
            'pendingCount' => $pendingCount,
            'cancelledCount' => $cancelledCount,
            'totalRevenue' => $totalRevenue,
            'currencySymbol' => $currencySymbol,
        ])->setPaper('a4', 'landscape');

        return $pdf->download('my-appointments-'.$filters['date_from'].'_'.$filters['date_to'].'.pdf');
    }

    public function calendar(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user->isEmployee(), 403);

        $business = $user->panelBusiness();
        abort_unless($business, 403);

        $view = $request->query('view', 'week');
        if (! is_string($view) || ! in_array($view, ['day', 'week'], true)) {
            $view = 'week';
        }

        $anchorDate = $this->resolveCalendarAnchorDate($request);
        $calendarFilters = $this->calendarFiltersFromRequest($request, (int) $user->id);

        $data = $this->appointmentService->getCalendarView($business, $view, $anchorDate, $calendarFilters);

        $data['employees'] = $data['employees']->filter(fn ($e) => (int) $e['id'] === (int) $user->id)->values();

        $data['filters'] = [
            'employee_id' => (string) $user->id,
            'status' => $calendarFilters['statuses'],
            'view' => $view,
            'date' => $anchorDate,
        ];

        $data['employee_calendar'] = true;

        return Inertia::render('Admin/Appointments/Calendar', $data);
    }

    public function update(UpdateAppointmentStatusRequest $request, Appointment $appointment): RedirectResponse
    {
        $validated = $request->validated();

        $this->appointmentService->updateEmployeeAppointmentStatus(
            auth()->id(),
            $appointment,
            $validated
        );

        $message = match ($validated['status'] ?? '') {
            'confirmed' => 'Appointment confirmed successfully.',
            'cancelled' => 'Appointment cancelled successfully.',
            default => 'Appointment updated successfully.',
        };

        return redirect()->back()
            ->with('success', $message)
            ->with('flash_nonce', uniqid('', true));
    }

    /**
     * Return available time slots for the authenticated employee on a given date,
     * excluding the current appointment from conflict checks.
     */
    public function slots(Request $request, Appointment $appointment): JsonResponse
    {
        abort_unless($appointment->employee_id === auth()->id(), 403);

        $date = $request->query('date');
        if (! $date || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            $date = $appointment->date->format('Y-m-d');
        }

        $business = $appointment->business;
        abort_unless($business, 404);

        $slots = $this->bookingService->getAdminAvailableSlots($business, [
            'employee_id' => auth()->id(),
            'service_id' => $appointment->service_id,
            'date' => $date,
            'exclude_id' => $appointment->id,
        ]);

        return response()->json(['slots' => $slots]);
    }

    /**
     * Reschedule an appointment (date + time only).
     * Employees can only reschedule their own non-cancelled appointments.
     */
    public function reschedule(UpdateAppointmentRescheduleRequest $request, Appointment $appointment): RedirectResponse
    {
        abort_unless($appointment->employee_id === auth()->id(), 403);
        abort_if($appointment->status->value === 'cancelled', 422, 'Cannot reschedule a cancelled appointment.');

        $duration = $appointment->service ? (int) $appointment->service->duration : 30;
        $endTime = Carbon::parse($request->date.' '.$request->start_time)
            ->addMinutes($duration)
            ->format('H:i');

        $appointment->update([
            'date' => $request->date,
            'start_time' => $request->start_time,
            'end_time' => $endTime,
            'updated_by' => auth()->id(),
        ]);

        return redirect()->back()
            ->with('success', 'Appointment rescheduled successfully.')
            ->with('flash_nonce', uniqid('', true));
    }

    /**
     * @return array{employee_id: int, date_from: string, date_to: string, statuses: list<string>, service_id: int|null, search: string|null}
     */
    private function employeeAppointmentsFiltersFromRequest(Request $request, User $user): array
    {
        $business = $user->panelBusiness();
        abort_unless($business, 403);

        $monthStart = Carbon::now()->startOfMonth()->toDateString();
        $monthEnd = Carbon::now()->endOfMonth()->toDateString();

        $from = $this->parseAppointmentsListDate($request->input('date_from'));
        $to = $this->parseAppointmentsListDate($request->input('date_to'));

        if ($request->filled('date') && $from === null && $to === null) {
            $legacy = $this->parseAppointmentsListDate($request->input('date'));
            if ($legacy !== null) {
                $from = $legacy;
                $to = $legacy;
            }
        }

        $from ??= $monthStart;
        $to ??= $monthEnd;
        if ($from > $to) {
            $to = $from;
        }

        $resolvedServiceId = null;
        $rawServiceId = $request->query('service_id');
        if ($rawServiceId !== null && $rawServiceId !== '') {
            $parsed = filter_var($rawServiceId, FILTER_VALIDATE_INT);
            if ($parsed !== false && $parsed > 0) {
                $belongs = Service::query()
                    ->whereKey($parsed)
                    ->where('business_id', $business->id)
                    ->exists();
                if ($belongs) {
                    $resolvedServiceId = (int) $parsed;
                }
            }
        }

        $search = $request->query('search');
        $search = is_string($search) ? trim($search) : '';
        if ($search !== '' && strlen($search) > 120) {
            $search = substr($search, 0, 120);
        }

        return [
            'employee_id' => (int) $user->id,
            'date_from' => $from,
            'date_to' => $to,
            'statuses' => $this->resolveStatusFilterStrings($request),
            'service_id' => $resolvedServiceId,
            'search' => $search !== '' ? $search : null,
        ];
    }

    private function parseAppointmentsListDate(mixed $value): ?string
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
