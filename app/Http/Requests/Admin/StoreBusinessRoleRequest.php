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
        $businessId = $this->user()->panelBusiness()?->id;

        return [
            'name' => [
                'required', 'string', 'max:100',
                Rule::unique('business_roles', 'name')->where('business_id', $businessId),
            ],
            'permissions' => ['required', 'array', 'min:1'],
            'permissions.*' => ['string', Rule::in(Permission::values())],
        ];
    }
}
