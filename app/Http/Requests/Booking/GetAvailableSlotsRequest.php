<?php

namespace App\Http\Requests\Booking;

use App\Models\Business;
use App\Models\Service;
use App\Models\User;
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
            'employee_id' => ['required', 'integer', 'exists:users,id'],
            'date' => ['required', 'date', 'after_or_equal:today'],
            'service_id' => ['nullable', 'integer', 'exists:services,id'],
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

            $employeeBelongsToBusiness = User::where('id', $employeeId)
                ->where('business_id', $business->id)
                ->where('is_active', true)
                ->exists();

            if (! $employeeBelongsToBusiness) {
                $validator->errors()->add('employee_id', 'The selected employee is not available for this business.');
            }

            $serviceId = $this->input('service_id');
            if ($serviceId) {
                $serviceBelongsToBusiness = Service::where('id', (int) $serviceId)
                    ->where('business_id', $business->id)
                    ->where('is_active', true)
                    ->exists();

                if (! $serviceBelongsToBusiness) {
                    $validator->errors()->add('service_id', 'The selected service is not available for this business.');
                }
            }
        });
    }
}
