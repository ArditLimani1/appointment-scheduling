<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateAppointmentStatusRequest;
use App\Models\Appointment;
use App\Services\Interfaces\AppointmentServiceInterface;
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
        $filters = $request->only(['employee_id', 'date_from', 'date_to', 'status']);
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
        $filters = $request->only(['employee_id', 'date_from', 'date_to', 'status']);

        return $this->appointmentService->export($business, $filters);
    }
}
