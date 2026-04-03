<?php

namespace App\Http\Requests\Booking;

use App\Models\Business;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;

class GetAvailableSlotsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('service_id') && ! $this->filled('service_ids')) {
            $this->merge(['service_ids' => [(int) $this->input('service_id')]]);
        }
    }

    public function rules(): array
    {
        return [
            'employee_id' => ['required', 'integer', 'exists:users,id'],
            'date' => ['required', 'date_format:Y-m-d'],
            'service_id' => ['nullable', 'integer', 'exists:services,id'],
            'service_ids' => ['nullable', 'array'],
            'service_ids.*' => ['integer', 'exists:services,id'],
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

            $timezone = $business->timezone ?: config('app.timezone');
            $dateInput = $this->input('date');
            if ($dateInput) {
                $requestDay = Carbon::parse($dateInput, $timezone)->startOfDay();
                $todayBusiness = Carbon::now($timezone)->startOfDay();
                if ($requestDay->lt($todayBusiness)) {
                    $validator->errors()->add('date', 'The date must be today or later.');
                }
            }

            $employeeId = (int) $this->input('employee_id');

            $employeeBelongsToBusiness = User::where('id', $employeeId)
                ->where('business_id', $business->id)
                ->where('is_active', true)
                ->exists();

            if (! $employeeBelongsToBusiness) {
                $validator->errors()->add('employee_id', 'The selected employee is not available for this business.');
            }

            $ids = array_values(array_unique(array_map('intval', $this->input('service_ids', []))));
            if (count($ids) === 0) {
                return;
            }

            $validCount = Service::where('business_id', $business->id)
                ->where('is_active', true)
                ->whereIn('id', $ids)
                ->count();

            if ($validCount !== count($ids)) {
                $validator->errors()->add('service_ids', 'One or more selected services are not available for this business.');
            }

            $employee = User::with(['services' => fn ($q) => $q->where('is_active', true)])->find($employeeId);
            foreach ($ids as $sid) {
                if (! $employee || ! $employee->services->contains('id', $sid)) {
                    $validator->errors()->add('service_ids', 'The selected professional does not offer all of the chosen services.');

                    break;
                }
            }
        });
    }
}
