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
        $businessId = $this->user()->ownedBusiness?->id ?? 'NULL';

        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/', 'unique:businesses,slug,' . $businessId],
            'location' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'slot_duration' => ['required', 'integer', 'min:5', 'max:120'],
            'min_booking_notice' => ['required', 'integer', 'min:0'],
            'max_booking_window' => ['required', 'integer', 'min:1'],
            'services_enabled' => ['required', 'boolean'],
        ];
    }
}
