<?php

namespace App\Http\Requests\Booking;

use App\Models\Business;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $business = Business::where('slug', $this->route('slug'))->first();
        $identifierType = $business?->client_identifier_type ?? 'phone';

        return [
            'client_first_name'  => ['required', 'string', 'max:100'],
            'client_last_name'   => ['required', 'string', 'max:100'],
            'client_phone'       => $identifierType === 'phone'
                ? ['required', 'string', 'max:50']
                : ['nullable', 'string', 'max:50'],
            'client_email'       => $identifierType === 'email'
                ? ['required', 'email', 'max:255']
                : ['nullable', 'email', 'max:255'],
            'client_notes'       => ['nullable', 'string', 'max:2000'],
            'employee_id'        => ['required', 'integer', 'exists:users,id'],
            'service_id'         => ['required', 'integer', 'exists:services,id'],
            'date'               => ['required', 'date', 'after_or_equal:today'],
            'start_time'         => ['required', 'date_format:H:i'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $business = Business::where('slug', $this->route('slug'))
                ->where('is_active', true)
                ->first();

            if (! $business) {
                return;
            }

            $employeeId = (int) $this->input('employee_id');
            $serviceId = (int) $this->input('service_id');

            $employeeBelongsToBusiness = User::where('id', $employeeId)
                ->where('business_id', $business->id)
                ->where('is_active', true)
                ->exists();

            if (! $employeeBelongsToBusiness) {
                $validator->errors()->add('employee_id', 'The selected employee is not available for this business.');
            }

            $serviceBelongsToBusiness = Service::where('id', $serviceId)
                ->where('business_id', $business->id)
                ->where('is_active', true)
                ->exists();

            if (! $serviceBelongsToBusiness) {
                $validator->errors()->add('service_id', 'The selected service is not available for this business.');
            }
        });
    }
}
