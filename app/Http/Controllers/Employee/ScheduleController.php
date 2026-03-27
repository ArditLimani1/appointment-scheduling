<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Http\Requests\Employee\UpdateScheduleRequest;
use App\Services\Interfaces\ScheduleServiceInterface;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    public function __construct(
        private ScheduleServiceInterface $scheduleService,
    ) {}

    public function index(): Response
    {
        $schedules = $this->scheduleService->getSchedules(auth()->user());

        return Inertia::render('Employee/Schedule/Index', [
            'schedules' => $schedules,
        ]);
    }

    public function update(UpdateScheduleRequest $request): RedirectResponse
    {
        $this->scheduleService->updateSchedules(auth()->user(), $request->validated());

        return redirect()->back()->with('success', 'Schedule updated successfully.');
    }
}
