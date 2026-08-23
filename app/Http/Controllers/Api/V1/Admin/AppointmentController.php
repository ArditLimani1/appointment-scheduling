<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ResolvesAdminAppointmentQuery;
use App\Http\Controllers\Concerns\ResolvesAppointmentCalendarQuery;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateAppointmentRequest;
use App\Http\Requests\Admin\UpdateAppointmentStatusRequest;
use App\Http\Requests\Appointment\InternalStoreAppointmentRequest;
use App\Models\Appointment;
use App\Repositories\Interfaces\EmployeeRepositoryInterface;
use App\Repositories\Interfaces\ServiceRepositoryInterface;
use App\Services\Interfaces\AppointmentServiceInterface;
use App\Services\Interfaces\BookingServiceInterface;
use App\Services\Interfaces\ScheduleServiceInterface;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AppointmentController extends Controller
{
    use ResolvesAdminAppointmentQuery;
    use ResolvesAppointmentCalendarQuery;

    public function __construct(
        private AppointmentServiceInterface $appointmentService,
        private BookingServiceInterface $bookingService,
        private ScheduleServiceInterface $scheduleService,
        private EmployeeRepositoryInterface $employeeRepository,
        private ServiceRepositoryInterface $serviceRepository,
    ) {}

    /** List view — same filters and payload as the Inertia page. */
    public function index(Request $request): JsonResponse
    {
        $business = $request->user()->panelBusiness();
        abort_unless($business, 403);

        $filters = $this->adminAppointmentsFiltersFromRequest($request);

        return response()->json($this->appointmentService->getFiltered($business, $filters));
    }

    /** Calendar view (day/week/rolling) across the business. */
    public function calendar(Request $request): JsonResponse
    {
        $business = $request->user()->panelBusiness();
        abort_unless($business, 403);

        return response()->json($this->buildAdminCalendarData($request, $business));
    }

    /** Bootstrap data for the internal "create appointment" form. */
    public function createData(Request $request): JsonResponse
    {
        $business = $request->user()->panelBusiness();
        abort_unless($business, 403);

        $employees = $this->employeeRepository->getActiveByBusiness($business->id, [
            'services' => fn ($q) => $q->where('is_active', true),
            'schedules',
        ]);

        $services = $this->serviceRepository->getActiveByBusiness($business->id);

        $timezone = $business->timezone ?: config('app.timezone');

        return response()->json([
            'business' => $business,
            'employees' => $employees,
            'services' => $services,
            'preselected_employee_id' => null,
            'booking_today' => Carbon::now($timezone)->toDateString(),
            'context' => 'admin',
        ]);
    }

    /** Create one or more appointments via the internal admin flow. */
    public function store(InternalStoreAppointmentRequest $request): JsonResponse
    {
        $business = $request->user()->panelBusiness();
        abort_unless($business, 403);

        $appointments = $this->bookingService->createInternalBooking($business, $request->validated(), 'admin');

        return response()->json([
            'message' => __('messages.appointment.created'),
            'appointments' => $appointments->load('service'),
        ], 201);
    }

    /** Status-only update (inline status menu). */
    public function update(UpdateAppointmentStatusRequest $request, Appointment $appointment): JsonResponse
    {
        $business = $request->user()->panelBusiness();
        abort_unless($business, 403);

        $updated = $this->appointmentService->updateStatus($business, $appointment, $request->validated());

        return response()->json([
            'message' => __('messages.status.updated'),
            'appointment' => $updated->load('service'),
        ]);
    }

    /** Full appointment edit (edit modal). */
    public function edit(UpdateAppointmentRequest $request, Appointment $appointment): JsonResponse
    {
        $business = $request->user()->panelBusiness();
        abort_unless($business, 403);

        $updated = $this->appointmentService->updateAppointment($business, $appointment, $request->validated());

        return response()->json([
            'message' => __('messages.appointment.updated'),
            'appointment' => $updated->load('service'),
        ]);
    }

    public function destroy(Request $request, Appointment $appointment): JsonResponse
    {
        $business = $request->user()->panelBusiness();
        abort_unless($business, 403);

        $this->appointmentService->delete($business, $appointment);

        return response()->json(['message' => __('messages.appointment.deleted')]);
    }

    /** Available time slots for the edit modal. */
    public function slots(Request $request): JsonResponse
    {
        $business = $request->user()->panelBusiness();
        abort_unless($business, 403);

        $request->validate([
            'employee_id' => [
                'required', 'integer',
                Rule::exists('users', 'id')->where('business_id', $business->id),
            ],
            'service_id' => [
                'required', 'integer',
                Rule::exists('services', 'id')->where('business_id', $business->id),
            ],
            'date' => ['required', 'date_format:Y-m-d'],
            'exclude_id' => ['nullable', 'integer'],
        ]);

        $slots = $this->bookingService->getAdminAvailableSlots($business, $request->only([
            'employee_id', 'service_id', 'date', 'exclude_id',
        ]));

        return response()->json(['slots' => $slots]);
    }

    /** Slot times for the internal create flow (multi-service aware). */
    public function internalSlots(Request $request): JsonResponse
    {
        $business = $request->user()->panelBusiness();
        abort_unless($business, 403);

        $request->validate([
            'employee_id' => [
                'required', 'integer',
                Rule::exists('users', 'id')->where('business_id', $business->id),
            ],
            'service_ids' => ['required', 'array', 'min:1'],
            'service_ids.*' => [
                'integer',
                Rule::exists('services', 'id')->where('business_id', $business->id),
            ],
            'date' => ['required', 'date_format:Y-m-d'],
        ]);

        $slots = $this->bookingService->getInternalAvailableSlots(
            $business,
            $request->only(['employee_id', 'service_ids', 'date']),
            'admin',
        );

        return response()->json(['slots' => $slots]);
    }
}
