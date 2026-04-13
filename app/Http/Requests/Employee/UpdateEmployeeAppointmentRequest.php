<?php

namespace App\Http\Requests\Employee;

use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmployeeAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'service_id' => ['required', 'integer', 'exists:services,id'],
            'status' => ['required', Rule::in(['pending', 'confirmed', 'cancelled'])],
            'date' => ['required', 'date_format:Y-m-d'],
            'start_time' => ['required', 'date_format:H:i'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $user = $this->user();
            if (! $user || ! $user->isEmployee() || ! $user->business_id) {
                return;
            }

            $serviceId = (int) $this->input('service_id');
            $service = Service::query()->whereKey($serviceId)->where('business_id', $user->business_id)->first();
            if (! $service) {
                $validator->errors()->add('service_id', 'Invalid service for this business.');

                return;
            }

            /** @var User $employee */
            $employee = User::query()->whereKey($user->id)->with('services')->first();
            if (! $employee || ! $employee->services->contains('id', $serviceId)) {
                $validator->errors()->add('service_id', 'You do not offer this service.');
            }
        });
    }
}
