<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;

class StoreEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('business_role_id') && $this->input('business_role_id') === '') {
            $this->merge(['business_role_id' => null]);
        }
    }

    public function rules(): array
    {
        $businessId = $this->user()->panelBusiness()?->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', Rules\Password::defaults()],
            'phone' => ['nullable', 'string', 'max:50'],
            'title' => ['nullable', 'string', 'max:255'],
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
