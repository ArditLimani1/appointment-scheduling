<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $businessId = auth()->user()?->panelBusiness()?->id;

        $slugUnique = Rule::unique('businesses', 'slug');
        if ($businessId) {
            $slugUnique = $slugUnique->ignore($businessId);
        }

        return [
            // Identity fields — sent by the Business Identity form
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'slug' => ['sometimes', 'required', 'string', 'max:100', 'alpha_dash', $slugUnique],
            'logo' => ['sometimes', 'nullable', 'image', 'max:2048'],

            // Booking rule fields — sent by the Booking Rules form
            'slot_duration' => ['sometimes', 'required', 'integer', 'min:5', 'max:120'],
            'min_booking_notice' => ['sometimes', 'required', 'integer', 'min:0'],
            'max_booking_window' => ['sometimes', 'required', 'integer', 'min:1'],
            'client_identifier_type' => ['sometimes', 'required', 'in:phone,email'],
            'owner_also_works_as_staff' => ['sometimes', 'boolean'],
            'allow_employee_service_edit' => ['sometimes', 'boolean'],
            'uses_shared_resources' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'slug.unique' => __('request_messages.settings.slug_unique'),
        ];
    }
}
