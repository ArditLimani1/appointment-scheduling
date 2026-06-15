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
        $canEditService = (bool) $this->user()?->panelBusiness()?->allow_employee_service_edit;

        return [
            'service_id' => $canEditService
                ? ['required', 'integer', 'exists:services,id']
                : ['nullable', 'integer', 'exists:services,id'],
            'status' => ['required', Rule::in(['pending', 'confirmed', 'cancelled'])],
            'date' => ['required', 'date_format:Y-m-d'],
            'start_time' => ['required', 'date_format:H:i'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $user = $this->user();
            if (! $user || ! $user->worksAsStaff() || ! $user->business_id) {
                return;
            }

            $canEditService = (bool) $user->panelBusiness()?->allow_employee_service_edit;
            $appointment = $this->route('appointment');
            if (! $canEditService) {
                if ($this->filled('service_id') && $appointment && (int) $this->input('service_id') !== (int) $appointment->service_id) {
                    $validator->errors()->add('service_id', __('request_messages.employee_appointment.service_change_disabled'));
                }

                return;
            }

            $serviceId = (int) $this->input('service_id');
            $service = Service::query()->whereKey($serviceId)->where('business_id', $user->business_id)->first();
            if (! $service) {
                $validator->errors()->add('service_id', __('request_messages.employee_appointment.service_invalid_business'));

                return;
            }

            /** @var User $employee */
            $employee = User::query()->whereKey($user->id)->with('services')->first();
            if (! $employee || ! $employee->services->contains('id', $serviceId)) {
                $validator->errors()->add('service_id', __('request_messages.employee_appointment.service_not_offered'));
            }
        });
    }
}
