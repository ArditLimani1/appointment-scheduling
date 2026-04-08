<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateAppointmentRequest;
use App\Http\Requests\Admin\UpdateAppointmentStatusRequest;
use App\Models\Appointment;
use App\Services\Interfaces\AppointmentServiceInterface;
use App\Services\Interfaces\BookingServiceInterface;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AppointmentController extends Controller
{
    public function __construct(
        private AppointmentServiceInterface $appointmentService,
        private BookingServiceInterface $bookingService,
    ) {}

    public function index(Request $request): Response
    {
        $business = auth()->user()->panelBusiness();
        abort_unless($business, 403);
        $filters  = $this->filtersFromRequest($request);
        $data     = $this->appointmentService->getFiltered($business, $filters);

        return Inertia::render('Admin/Appointments/Index', $data);
    }

    /** PATCH — status-only update (from the inline status menu) */
    public function update(UpdateAppointmentStatusRequest $request, Appointment $appointment): RedirectResponse
    {
        $business = auth()->user()->panelBusiness();
        abort_unless($business, 403);
        $this->appointmentService->updateStatus($business, $appointment, $request->validated());

        return redirect()->back()->with('success', 'Appointment updated successfully.');
    }

    /** PUT — full appointment edit (from the edit modal) */
    public function edit(UpdateAppointmentRequest $request, Appointment $appointment): RedirectResponse
    {
        $business = auth()->user()->panelBusiness();
        abort_unless($business, 403);
        $this->appointmentService->updateAppointment($business, $appointment, $request->validated());

        return redirect()->back()->with('success', 'Appointment updated successfully.');
    }

    /** GET — available time slots for admin edit modal */
    public function slots(Request $request): JsonResponse
    {
        $request->validate([
            'employee_id' => ['required', 'integer', 'exists:users,id'],
            'service_id'  => ['required', 'integer', 'exists:services,id'],
            'date'        => ['required', 'date_format:Y-m-d'],
            'exclude_id'  => ['nullable', 'integer'],
        ]);

        $business = auth()->user()->panelBusiness();
        abort_unless($business, 403);
        $slots    = $this->bookingService->getAdminAvailableSlots($business, $request->only([
            'employee_id', 'service_id', 'date', 'exclude_id',
        ]));

        return response()->json(['slots' => $slots]);
    }

    public function destroy(Appointment $appointment): RedirectResponse
    {
        $business = auth()->user()->panelBusiness();
        abort_unless($business, 403);
        $this->appointmentService->delete($business, $appointment);

        return redirect()->back()->with('success', 'Appointment deleted successfully.');
    }

    public function export(Request $request): BinaryFileResponse
    {
        $business = auth()->user()->panelBusiness();
        abort_unless($business, 403);
        $filters  = $this->filtersFromRequest($request);

        return $this->appointmentService->export($business, $filters);
    }

    /**
     * @return array{employee_id?: int, date_from?: string, date_to?: string, status?: string}
     */
    private function filtersFromRequest(Request $request): array
    {
        $filters = [];

        $employeeIdRaw = $request->query('employee_id');
        if ($employeeIdRaw !== null && $employeeIdRaw !== '' && is_numeric($employeeIdRaw)) {
            $id = (int) $employeeIdRaw;
            if ($id > 0) {
                $filters['employee_id'] = $id;
            }
        }

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

        $status = $request->query('status');
        if (is_string($status) && $status !== '') {
            $filters['status'] = $status;
        }

        return $filters;
    }
}
