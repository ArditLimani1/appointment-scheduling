<?php

namespace App\Http\Requests\Admin;

use App\Enums\Permission;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBusinessRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasPermission(Permission::AdminRoles->value);
    }

    public function rules(): array
    {
        $businessId = $this->user()->panelBusiness()?->id;
        $roleId = $this->route('role')?->id;
        $allowedPermissions = Permission::values();
        if ($this->user()->panelBusiness() && ! $this->user()->panelBusiness()->uses_shared_resources) {
            $allowedPermissions = array_values(array_filter(
                $allowedPermissions,
                fn (string $p) => $p !== Permission::AdminSharedResources->value
            ));
        }

        return [
            'name' => [
                'required', 'string', 'max:100',
                Rule::unique('business_roles', 'name')
                    ->where('business_id', $businessId)
                    ->ignore($roleId),
            ],
            'permissions' => ['required', 'array', 'min:1'],
            'permissions.*' => ['string', Rule::in($allowedPermissions)],
        ];
    }
}
