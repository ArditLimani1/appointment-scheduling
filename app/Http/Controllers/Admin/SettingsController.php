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
        $hadBusiness = auth()->user()->panelBusiness() !== null;

        $validated = $request->validated();
        $ownerStaff = null;
        if (array_key_exists('owner_also_works_as_staff', $validated)) {
            $ownerStaff = (bool) $validated['owner_also_works_as_staff'];
            unset($validated['owner_also_works_as_staff']);
        }

        $user = auth()->user();
        $business = $this->businessService->updateSettings($user, $validated);

        if ($user->isAdmin() && $ownerStaff !== null && (int) $business->owner_id === (int) $user->id) {
            $user->syncAlsoWorksAsStaff($business, $ownerStaff);
        }

        if (! $hadBusiness) {
            return redirect()
                ->route('admin.dashboard')
                ->with('success', 'Business setup completed. Welcome to your dashboard.');
        }

        return redirect()->back()->with('success', 'Settings updated successfully.');
    }
}
