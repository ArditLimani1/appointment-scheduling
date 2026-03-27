<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSettingsRequest;
use App\Services\Interfaces\BusinessServiceInterface;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function __construct(
        private BusinessServiceInterface $businessService,
    ) {}

    public function index(): Response
    {
        $data = $this->businessService->getSettingsForUser(auth()->user());

        return Inertia::render('Admin/Settings/Index', $data);
    }

    public function update(UpdateSettingsRequest $request): RedirectResponse
    {
        $this->businessService->updateSettings(auth()->user(), $request->validated());

        return redirect()->back()->with('success', 'Settings updated successfully.');
    }
}
