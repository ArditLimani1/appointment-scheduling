<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Concerns\ResolvesAppointmentCalendarQuery;
use App\Http\Controllers\Controller;
use App\Http\Requests\Employee\UpdateAppointmentStatusRequest;
use App\Models\Appointment;
use App\Services\Interfaces\AppointmentServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentController extends Controller
{
    use ResolvesAppointmentCalendarQuery;

    public function __construct(
        private AppointmentServiceInterface $appointmentService,
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
        $this->appointmentService->updateEmployeeAppointmentStatus(
            auth()->id(),
            $appointment,
            $request->validated()
        );

        return redirect()->back()->with('success', 'Appointment updated successfully.');
    }
}
