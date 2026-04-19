<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSettingsRequest;
use App\Services\Interfaces\BusinessServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
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
        $currentBusiness = $user->panelBusiness();
        if ($request->hasFile('logo')) {
            if ($currentBusiness?->logo) {
                Storage::disk('public')->delete($currentBusiness->logo);
            }
            $validated['logo'] = $request->file('logo')->store('business-logos', 'public');
        }

        $business = $this->businessService->updateSettings($user, $validated);

        if ($user->isAdmin() && $ownerStaff !== null && (int) $business->owner_id === (int) $user->id) {
            $user->syncAlsoWorksAsStaff($business, $ownerStaff);
        }

        if (! $hadBusiness) {
            return redirect()
                ->route('admin.dashboard')
                ->with('success', __('messages.settings.setup_completed'))
                ->with('flash_nonce', uniqid('', true));
        }

        return redirect()->back()
            ->with('success', __('messages.settings.saved'))
            ->with('flash_nonce', uniqid('', true));
    }
}
