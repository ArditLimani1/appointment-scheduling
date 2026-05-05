<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;

class UpdateEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user || ! $user->hasPermission('admin.employees')) {
            return false;
        }

        $business = $user->panelBusiness();
        $employee = $this->route('employee');

        return $business && $employee && (int) $employee->business_id === (int) $business->id;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('business_role_id') && $this->input('business_role_id') === '') {
            $this->merge(['business_role_id' => null]);
        }
    }

    public function rules(): array
    {
        $employeeId = $this->route('employee')->id;
        $businessId = $this->user()->panelBusiness()?->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required', 'string', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore($employeeId),
            ],
            'password' => ['nullable', Rules\Password::defaults()],
            'phone' => ['nullable', 'string', 'max:50'],
            'title' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
            'business_role_id' => [
                'nullable', 'integer',
                Rule::exists('business_roles', 'id')->where('business_id', $businessId),
            ],
            'service_ids' => ['nullable', 'array'],
            'service_ids.*' => [
                'integer',
                Rule::exists('services', 'id')->where('business_id', $businessId),
            ],
        ];
    }
}
