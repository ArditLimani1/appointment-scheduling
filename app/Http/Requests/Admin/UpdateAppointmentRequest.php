<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_first_name' => ['required', 'string', 'max:100'],
            'client_last_name' => ['required', 'string', 'max:100'],
            'client_phone' => ['nullable', 'string', 'max:50'],
            'client_email' => ['nullable', 'email', 'max:255'],
            'client_notes' => ['nullable', 'string', 'max:2000'],
            'service_id' => ['required', 'integer', 'exists:services,id'],
            'status' => ['required', 'in:pending,confirmed,cancelled'],
            'employee_id' => ['required', 'integer', 'exists:users,id'],
            'date' => ['required', 'date_format:Y-m-d'],
            'start_time' => ['required', 'date_format:H:i'],
        ];
    }
}
