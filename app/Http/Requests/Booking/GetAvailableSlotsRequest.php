<?php

namespace App\Http\Requests\Booking;

use Illuminate\Foundation\Http\FormRequest;

class GetAvailableSlotsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'exists:users,id'],
            'date' => ['required', 'date'],
            'service_id' => ['nullable', 'exists:services,id'],
        ];
    }
}
