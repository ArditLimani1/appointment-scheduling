<?php

namespace App\Http\Controllers\Api\V1\Employee;

use App\Http\Controllers\Concerns\ResolvesAppointmentCalendarQuery;
use App\Http\Controllers\Concerns\ResolvesEmployeeAppointmentQuery;
use App\Http\Controllers\Controller;
use App\Http\Requests\Appointment\InternalStoreAppointmentRequest;
use App\Http\Requests\Employee\UpdateAppointmentRescheduleRequest;
use App\Http\Requests\Employee\UpdateAppointmentStatusRequest;
use App\Http\Requests\Employee\UpdateEmployeeAppointmentRequest;
use App\Models\Appointment;
use App\Models\User;
use App\Services\Interfaces\AppointmentServiceInterface;
use App\Services\Interfaces\BookingServiceInterface;
use App\Services\Interfaces\ScheduleServiceInterface;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AppointmentController extends Controller
{
    use ResolvesAppointmentCalendarQuery;
    use ResolvesEmployeeAppointmentQuery;

    public function __construct(
        private AppointmentServiceInterface $appointmentService,
        private BookingServiceInterface $bookingService,
        private ScheduleServiceInterface $scheduleService,
    ) {}

    /** List view — same filters and payload as the Inertia page. */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $business = $user->panelBusiness();
        abort_unless($business, 403);

        $filters = $this->employeeAppointmentsFiltersFromRequest($request, $user);

        return response()->json($this->appointmentService->getFiltered($business, $filters));
    }

    /** Calendar view (day/week/rolling) for the authenticated employee. */
    public function calendar(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->worksAsStaff(), 403);

        return response()->json($this->buildEmployeeCalendarData($request, $user));
    }

    /** Bootstrap data for the internal "create appointment" form. */
    public function createData(Request $request): JsonResponse
    {
        $user = $request->user();
        $business = $user->panelBusiness();
        abort_unless($business, 403);

        $services = $user->services()->where('is_active', true)->get();

        $self = User::with(['schedules', 'services' => fn ($q) => $q->where('is_active', true)])
            ->find($user->id);

        $timezone = $business->timezone ?: config('app.timezone');

        return response()->json([
            'business' => $business,
            'employees' => $self ? collect([$self])->values() : collect([]),
            'services' => $services,
            'preselected_employee_id' => (int) $user->id,
            'booking_today' => Carbon::now($timezone)->toDateString(),
            'context' => 'employee',
        ]);
    }

    /** Create one appointment for the authenticated employee themselves. */
    public function store(InternalStoreAppointmentRequest $request): JsonResponse
    {
        $business = $request->user()->panelBusiness();
        abort_unless($business, 403);

        $validated = $request->validated();
        // Defensive: BookingService also forces this for 'employee' context.
        $validated['employee_id'] = (int) $request->user()->id;

        $appointments = $this->bookingService->createInternalBooking($business, $validated, 'employee');

        return response()->json([
            'message' => __('messages.appointment.created'),
            'appointments' => $appointments->load('service'),
        ], 201);
    }

    /** Status change (confirm / cancel) on an appointment assigned to the employee. */
    public function update(UpdateAppointmentStatusRequest $request, Appointment $appointment): JsonResponse
    {
        $updated = $this->appointmentService->updateEmployeeAppointmentStatus(
            $request->user()->id,
            $appointment,
            $request->validated(),
        );

        return response()->json([
            'message' => __('messages.status.updated'),
            'appointment' => $updated->load('service'),
        ]);
    }

    /** Full edit (service, status, date, time) of the employee's own appointment. */
    public function edit(UpdateEmployeeAppointmentRequest $request, Appointment $appointment): JsonResponse
    {
        abort_unless($appointment->employee_id === $request->user()->id, 403);

        $updated = $this->appointmentService->updateEmployeeOwnAppointment(
            (int) $request->user()->id,
            $appointment,
            $request->validated(),
        );

        return response()->json([
            'message' => __('messages.appointment.updated'),
            'appointment' => $updated->load('service'),
        ]);
    }

    /** Reschedule (date + time only) the employee's own non-cancelled appointment. */
    public function reschedule(UpdateAppointmentRescheduleRequest $request, Appointment $appointment): JsonResponse
    {
        abort_unless($appointment->employee_id === $request->user()->id, 403);
        abort_if($appointment->status->value === 'cancelled', 422, 'Cannot reschedule a cancelled appointment.');

        $v = $request->validated();
        $this->appointmentService->rescheduleEmployeeOwnAppointment(
            $appointment,
            $v['date'],
            $v['start_time'],
        );

        return response()->json([
            'message' => __('messages.appointment.updated'),
            'appointment' => $appointment->fresh()->load('service'),
        ]);
    }

    /**
     * Available slots for the employee on a date, excluding the given appointment
     * from conflict checks (reschedule flow).
     */
    public function slots(Request $request, Appointment $appointment): JsonResponse
    {
        $user = $request->user();
        abort_unless($appointment->employee_id === $user->id, 403);

        $date = $request->query('date');
        if (! $date || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            $date = $appointment->date->format('Y-m-d');
        }

        $business = $appointment->business;
        abort_unless($business, 404);

        $serviceId = $appointment->service_id;
        $rawServiceId = $request->query('service_id');
        $canEditService = (bool) ($user->panelBusiness()?->allow_employee_service_edit ?? true);
        if ($canEditService && $rawServiceId !== null && $rawServiceId !== '' && is_numeric($rawServiceId)) {
            $candidate = (int) $rawServiceId;
            $offers = $user->services()->whereKey($candidate)->exists();
            abort_unless($offers, 422, 'Invalid service.');
            $serviceId = $candidate;
        }

        $slots = $this->bookingService->getAdminAvailableSlots($business, [
            'employee_id' => $user->id,
            'service_id' => $serviceId,
            'date' => $date,
            'exclude_id' => $appointment->id,
        ]);

        return response()->json(['slots' => $slots]);
    }

    /** Slot times for the internal create flow (employee_id forced server-side). */
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
}
