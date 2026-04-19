<?php

namespace App\Http\Requests\SuperAdmin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBusinessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() ?? false;
    }

    public function rules(): array
    {
        $businessId = $this->route('business')?->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'alpha_dash', Rule::unique('businesses', 'slug')->ignore($businessId)],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'location' => ['nullable', 'string', 'max:255'],
            'business_type_id' => ['nullable', 'exists:business_types,id'],
            'timezone' => ['required', 'string', 'max:64'],
            'currency' => ['required', 'string', 'max:8'],
            'currency_symbol' => ['required', 'string', 'max:8'],
            'slot_duration' => ['required', 'integer', 'min:5', 'max:480'],
            'min_booking_notice' => ['required', 'integer', 'min:0', 'max:10080'],
            'max_booking_window' => ['required', 'integer', 'min:1', 'max:365'],
            'client_identifier_type' => ['required', 'in:phone,email'],
            'allow_employee_service_edit' => ['boolean'],
        ];
    }
}
