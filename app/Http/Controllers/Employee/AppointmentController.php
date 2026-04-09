<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Concerns\ResolvesAppointmentCalendarQuery;
use App\Http\Controllers\Controller;
use App\Http\Requests\Employee\UpdateAppointmentRescheduleRequest;
use App\Http\Requests\Employee\UpdateAppointmentStatusRequest;
use App\Models\Appointment;
use App\Services\Interfaces\AppointmentServiceInterface;
use App\Services\Interfaces\BookingServiceInterface;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentController extends Controller
{
    use ResolvesAppointmentCalendarQuery;

    public function __construct(
        private AppointmentServiceInterface $appointmentService,
        private BookingServiceInterface $bookingService,
    ) {}

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
}
