<?php

namespace App\Http\Controllers\Employee;

use App\Enums\AppointmentStatus;
use App\Enums\Permission;
use App\Exports\EmployeeAppointmentsExport;
use App\Http\Controllers\Concerns\ResolvesAppointmentCalendarQuery;
use App\Http\Controllers\Concerns\ResolvesEmployeeAppointmentQuery;
use App\Http\Controllers\Controller;
use App\Http\Requests\Appointment\InternalStoreAppointmentRequest;
use App\Http\Requests\Employee\UpdateAppointmentRescheduleRequest;
use App\Http\Requests\Employee\UpdateAppointmentStatusRequest;
use App\Http\Requests\Employee\UpdateEmployeeAppointmentRequest;
use App\Models\Appointment;
use App\Models\Service;
use App\Models\User;
use App\Models\UserAppointmentViewPreference;
use App\Services\Interfaces\AppointmentServiceInterface;
use App\Services\Interfaces\BookingServiceInterface;
use App\Services\Interfaces\ScheduleServiceInterface;
use App\Support\AppointmentListScope;
use App\Support\InternalRedirect;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AppointmentController extends Controller
{
    use ResolvesAppointmentCalendarQuery;
    use ResolvesEmployeeAppointmentQuery;

    public function __construct(
        private AppointmentServiceInterface $appointmentService,
        private BookingServiceInterface $bookingService,
        private ScheduleServiceInterface $scheduleService,
    ) {}

    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        $business = $user->panelBusiness();
        abort_unless($business, 403);

        $preference = UserAppointmentViewPreference::firstOrCreate(
            ['user_id' => $user->id],
            ['is_calendar_default' => false],
        );

        $forceTable = $request->boolean('list');
        if (
            $preference->is_calendar_default
            && ! $forceTable
            && $user->hasPermission(Permission::EmployeeAppointments->value)
        ) {
            return redirect()->route('employee.appointments.calendar');
        }

        $preference->update(['is_calendar_default' => false]);

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

        return Excel::download(new EmployeeAppointmentsExport($exportFilters), __('exports.files.my_appointments').'.xlsx');
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

        AppointmentListScope::applyUpcoming($query, $filters);

        $appointments = AppointmentListScope::applyOrder($query, $filters)->get();

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
            'generatedAt' => Carbon::now()->locale(app()->getLocale())->translatedFormat('d F Y, H:i'),
            'dateFrom' => $filters['date_from'],
            'dateTo' => $filters['date_to'],
            'scopeLabel' => __('exports.common.scope_'.$filters['scope']),
            'serviceFilter' => $serviceFilter,
            'statusFilter' => ! empty($filters['statuses']) && is_array($filters['statuses'])
                ? implode(', ', array_values(array_filter(array_map(function ($s) {
                    $status = AppointmentStatus::tryFrom((string) $s);

                    return $status ? __('exports.common.'.$status->value) : null;
                }, $filters['statuses']))))
                : null,
            'appointments' => $appointments,
            'totalCount' => $appointments->count(),
            'confirmedCount' => $confirmedCount,
            'pendingCount' => $pendingCount,
            'cancelledCount' => $cancelledCount,
            'totalRevenue' => $totalRevenue,
            'currencySymbol' => $currencySymbol,
        ])->setPaper('a4', 'landscape');

        $fileSuffix = implode('_', array_filter([
            $filters['date_from'] ?? null,
            $filters['date_to'] ?? null,
        ])) ?: $filters['scope'];

        return $pdf->download(
            __('exports.files.my_appointments').'-'.$fileSuffix.'.pdf'
        );
    }

    public function calendar(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user->worksAsStaff(), 403);

        $data = $this->buildEmployeeCalendarData($request, $user);

        UserAppointmentViewPreference::updateOrCreate(
            ['user_id' => $user->id],
            ['is_calendar_default' => true],
        );

        return Inertia::render('Admin/Appointments/Calendar', $data);
    }

    /**
     * Full edit (service, status, date, time) for the authenticated employee's own appointment.
     */
    public function edit(UpdateEmployeeAppointmentRequest $request, Appointment $appointment): RedirectResponse
    {
        abort_unless($appointment->employee_id === auth()->id(), 403);

        $this->appointmentService->updateEmployeeOwnAppointment(
            (int) auth()->id(),
            $appointment,
            $request->validated(),
        );

        return redirect()->back()
            ->with('success', __('messages.appointment.updated'))
            ->with('flash_nonce', uniqid('', true));
    }

    public function update(UpdateAppointmentStatusRequest $request, Appointment $appointment): RedirectResponse
    {
        $validated = $request->validated();

        $this->appointmentService->updateEmployeeAppointmentStatus(
            auth()->id(),
            $appointment,
            $validated
        );

        return redirect()->back()
            ->with('success', __('messages.status.updated'))
            ->with('flash_nonce', uniqid('', true));
    }

    /** GET — Inertia page that hosts the internal "Krijo termin" form for the auth employee. */
    public function create(Request $request): Response
    {
        $user = $request->user();
        $business = $user->panelBusiness();
        abort_unless($business, 403);

        $services = $user->services()->where('is_active', true)->get();

        $self = User::with(['schedules', 'services' => fn ($q) => $q->where('is_active', true)])
            ->find($user->id);

        $timezone = $business->timezone ?: config('app.timezone');

        return Inertia::render('Employee/Appointments/Create', [
            'business' => $business,
            'employees' => $self ? collect([$self])->values() : collect([]),
            'services' => $services,
            'preselected_employee_id' => (int) $user->id,
            'return_to' => $this->resolveReturnTo($request),
            'booking_today' => Carbon::now($timezone)->toDateString(),
            'context' => 'employee',
        ]);
    }

    /** POST — create one appointment for the authenticated employee themselves. */
    public function store(InternalStoreAppointmentRequest $request): RedirectResponse
    {
        $business = $request->user()->panelBusiness();
        abort_unless($business, 403);

        $validated = $request->validated();
        // Defensive: BookingService also forces this for 'employee' context.
        $validated['employee_id'] = (int) $request->user()->id;

        $this->bookingService->createInternalBooking($business, $validated, 'employee');

        return redirect()->to(InternalRedirect::resolve(
            $validated['return_to'] ?? null,
            route('employee.appointments.index'),
        ))
            ->with('success', __('messages.appointment.created'))
            ->with('flash_nonce', uniqid('', true));
    }

    /** GET — slot times for the internal create flow (employee_id forced server-side). */
    public function internalSlots(Request $request): JsonResponse
    {
        $business = $request->user()->panelBusiness();
        abort_unless($business, 403);

        $request->validate([
            'service_ids' => ['required', 'array', 'min:1'],
            'service_ids.*' => [
                'integer',
                Rule::exists('services', 'id')->where('business_id', $business->id),
            ],
            'date' => ['required', 'date_format:Y-m-d'],
        ]);

        $slots = $this->bookingService->getInternalAvailableSlots(
            $business,
            [
                'employee_id' => (int) $request->user()->id,
                'service_ids' => $request->input('service_ids'),
                'date' => $request->input('date'),
            ],
            'employee',
        );

        return response()->json(['slots' => $slots]);
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

        $serviceId = $appointment->service_id;
        $rawServiceId = $request->query('service_id');
        $canEditService = (bool) ($request->user()?->panelBusiness()?->allow_employee_service_edit ?? true);
        if ($canEditService && $rawServiceId !== null && $rawServiceId !== '' && is_numeric($rawServiceId)) {
            $candidate = (int) $rawServiceId;
            $offers = auth()->user()->services()->whereKey($candidate)->exists();
            abort_unless($offers, 422, 'Invalid service.');
            $serviceId = $candidate;
        }

        $slots = $this->bookingService->getAdminAvailableSlots($business, [
            'employee_id' => auth()->id(),
            'service_id' => $serviceId,
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

        $v = $request->validated();
        $this->appointmentService->rescheduleEmployeeOwnAppointment(
            $appointment,
            $v['date'],
            $v['start_time'],
        );

        return redirect()->back()
            ->with('success', __('messages.appointment.updated'))
            ->with('flash_nonce', uniqid('', true));
    }

    /**
     * Reads ?return_to= from the GET request, validates it via InternalRedirect
     * and forwards a safe value to the Inertia page so the form can echo it back.
     */
    private function resolveReturnTo(Request $request): ?string
    {
        $raw = $request->query('return_to');
        if (! is_string($raw) || $raw === '') {
            return null;
        }

        $resolved = InternalRedirect::resolve($raw, '');

        return $resolved !== '' ? $resolved : null;
    }
}
