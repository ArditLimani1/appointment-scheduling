<?php

namespace App\Http\Requests\Booking;

use Illuminate\Foundation\Http\FormRequest;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_first_name' => ['required', 'string', 'max:255'],
            'client_last_name' => ['required', 'string', 'max:255'],
            'client_phone' => ['required', 'string', 'max:255'],
            'client_notes' => ['nullable', 'string'],
            'employee_id' => ['required', 'exists:users,id'],
            'service_id' => ['required', 'exists:services,id'],
            'date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
        ];
    }
}
