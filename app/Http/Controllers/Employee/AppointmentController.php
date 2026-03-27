<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Http\Requests\Employee\UpdateAppointmentStatusRequest;
use App\Models\Appointment;
use App\Services\Interfaces\AppointmentServiceInterface;
use Illuminate\Http\RedirectResponse;

class AppointmentController extends Controller
{
    public function __construct(
        private AppointmentServiceInterface $appointmentService,
    ) {}

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
