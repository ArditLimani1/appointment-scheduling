<?php

namespace App\Http\Resources\Api;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The mobile app's boot payload: user, business context, effective permissions
 * and the nav-gating flags mirrored from the web layouts.
 *
 * @mixin User
 */
class MeResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var User $user */
        $user = $this->resource;
        $business = $user->panelBusiness();

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'title' => $user->title,
                'avatar' => $user->avatar,
                'role' => $user->role?->value,
                'locale' => $user->preferredLocale(),
                'booking_slug' => $user->booking_slug,
                'also_works_as_staff' => (bool) $user->also_works_as_staff,
                'onboarding_completed' => $user->hasCompletedOnboarding(),
            ],
            'business' => $business ? [
                'id' => $business->id,
                'name' => $business->name,
                'slug' => $business->slug,
                'logo' => $business->logo,
                'timezone' => $business->timezone ?: config('app.timezone'),
                'currency' => $business->currency,
                'currency_symbol' => $business->currency_symbol,
                'slot_duration' => $business->slot_duration,
                'client_identifier_type' => $business->client_identifier_type,
                'uses_shared_resources' => (bool) $business->uses_shared_resources,
                'allow_employee_service_edit' => (bool) $business->allow_employee_service_edit,
                'auto_confirm_appointments' => (bool) $business->auto_confirm_appointments,
            ] : null,
            'permissions' => $user->effectivePermissionKeys(),
            'features' => [
                'admin_panel' => $user->hasAdminPanelAccess(),
                'employee_area' => $user->isEmployee() || ($user->isAdmin() && (bool) $user->also_works_as_staff),
            ],
        ];
    }
}
