<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateAppointmentStatusRequest;
use App\Models\Appointment;
use App\Services\Interfaces\AppointmentServiceInterface;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AppointmentController extends Controller
{
    public function __construct(
        private AppointmentServiceInterface $appointmentService,
    ) {}

    public function index(Request $request): Response
    {
        $business = auth()->user()->ownedBusiness;
        $filters = $this->filtersFromRequest($request);
        $data = $this->appointmentService->getFiltered($business, $filters);

        return Inertia::render('Admin/Appointments/Index', $data);
    }

    public function update(UpdateAppointmentStatusRequest $request, Appointment $appointment): RedirectResponse
    {
        $business = auth()->user()->ownedBusiness;
        $this->appointmentService->updateStatus($business, $appointment, $request->validated());

        return redirect()->back()->with('success', 'Appointment updated successfully.');
    }

    public function destroy(Appointment $appointment): RedirectResponse
    {
        $business = auth()->user()->ownedBusiness;
        $this->appointmentService->delete($business, $appointment);

        return redirect()->back()->with('success', 'Appointment deleted successfully.');
    }

    public function export(Request $request): BinaryFileResponse
    {
        $business = auth()->user()->ownedBusiness;
        $filters = $this->filtersFromRequest($request);

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
