<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSettingsRequest;
use App\Services\Interfaces\BusinessServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingsController extends Controller
{
    public function __construct(
        private BusinessServiceInterface $businessService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->businessService->getSettingsForUser($request->user()));
    }

    /**
     * Personal notification preference — gated on `admin.appointments`, not
     * `admin.settings`, because it is the viewer's own choice about watching
     * other staff's bookings. Mirrors the web endpoint.
     */
    public function updateNotificationPreferences(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'notify_others_appointments' => ['required', 'boolean'],
        ]);

        $request->user()->update($validated);

        return response()->json([
            'message' => __('messages.settings.saved'),
            'notify_others_appointments' => (bool) $request->user()->notify_others_appointments,
        ]);
    }

    public function update(UpdateSettingsRequest $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validated();
        $ownerStaff = null;
        if (array_key_exists('owner_also_works_as_staff', $validated)) {
            $ownerStaff = (bool) $validated['owner_also_works_as_staff'];
            unset($validated['owner_also_works_as_staff']);
        }

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

        return response()->json([
            'message' => __('messages.settings.saved'),
            'settings' => $this->businessService->getSettingsForUser($user->fresh()),
        ]);
    }
}
