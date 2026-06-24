<?php

namespace App\Http\Requests\Admin;

use App\Support\ClientIdentification;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user || ! $user->hasPermission('admin.appointments')) {
            return false;
        }

        $business = $user->panelBusiness();
        $appointment = $this->route('appointment');

        return $business && $appointment && (int) $appointment->business_id === (int) $business->id;
    }

    public function rules(): array
    {
        $business = $this->user()?->panelBusiness();
        $businessId = $business?->id;
        $clientFields = ClientIdentification::clientFieldRules($business?->client_identifier_type);

        return [
            'client_first_name' => ['required', 'string', 'max:100'],
            'client_last_name' => ['required', 'string', 'max:100'],
            'client_phone' => $clientFields['client_phone'],
            'client_email' => $clientFields['client_email'],
            'client_notes' => ['nullable', 'string', 'max:2000'],
            'service_id' => [
                'required', 'integer',
                Rule::exists('services', 'id')->where('business_id', $businessId),
            ],
            'status' => ['required', 'in:pending,confirmed,cancelled'],
            'employee_id' => [
                'required', 'integer',
                Rule::exists('users', 'id')->where('business_id', $businessId),
            ],
            'date' => ['required', 'date_format:Y-m-d'],
            'start_time' => ['required', 'date_format:H:i'],
        ];
    }
}
