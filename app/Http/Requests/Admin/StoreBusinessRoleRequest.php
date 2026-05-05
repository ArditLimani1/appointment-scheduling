<?php

namespace App\Http\Requests\Admin;

use App\Enums\Permission;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBusinessRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasPermission(Permission::AdminRoles->value);
    }

    public function rules(): array
    {
        $actor = $this->user();
        $business = $actor->panelBusiness();
        $businessId = $business?->id;

        $allowedPermissions = $this->grantablePermissionsFor($actor, $business);

        return [
            'name' => [
                'required', 'string', 'max:100',
                Rule::unique('business_roles', 'name')->where('business_id', $businessId),
            ],
            'permissions' => ['required', 'array', 'min:1'],
            'permissions.*' => ['string', Rule::in($allowedPermissions)],
        ];
    }

    /**
     * @return list<string>
     */
    private function grantablePermissionsFor($actor, $business): array
    {
        $base = Permission::values();
        if ($business && ! $business->uses_shared_resources) {
            $base = array_values(array_filter(
                $base,
                fn (string $p) => $p !== Permission::AdminSharedResources->value
            ));
        }

        if ($actor && $business && $actor->isOwnerOf($business)) {
            return $base;
        }

        $own = $actor ? $actor->effectivePermissionKeys() : [];

        return array_values(array_intersect($base, $own));
    }
}
