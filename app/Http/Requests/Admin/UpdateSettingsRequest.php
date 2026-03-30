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
        $ownedBusinessId = $this->user()->ownedBusiness?->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'required', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/',
                Rule::unique('businesses', 'slug')->ignore($ownedBusinessId),
            ],
            'location' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'slot_duration' => ['required', 'integer', 'min:5', 'max:120'],
            'min_booking_notice' => ['required', 'integer', 'min:0'],
            'max_booking_window' => ['required', 'integer', 'min:1'],
            'services_enabled' => ['required', 'boolean'],
        ];
    }
}
