<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'slot_duration' => ['required', 'integer', 'min:5', 'max:120'],
            'min_booking_notice' => ['required', 'integer', 'min:0'],
            'max_booking_window' => ['required', 'integer', 'min:1'],
            'services_enabled' => ['required', 'boolean'],
            'client_identifier_type' => ['required', 'in:phone,email'],
            'owner_also_works_as_staff' => ['sometimes', 'boolean'],
        ];
    }
}
