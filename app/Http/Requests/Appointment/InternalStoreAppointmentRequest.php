<?php

namespace App\Http\Requests\Appointment;

use App\Http\Requests\Concerns\SanitizesBookingClientFields;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Validates POST payload for the internal admin/employee "Krijo termin" flow.
 *
 * Differences from the public StoreBookingRequest:
 * - No min_booking_notice / max_booking_window enforcement.
 * - Operates against the authenticated user's panel business, not a public slug.
 * - For employee context, employee_id is forced to auth()->id() server-side.
 */
class InternalStoreAppointmentRequest extends FormRequest
{
    use SanitizesBookingClientFields;

    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user) {
            return false;
        }

        $business = $user->panelBusiness();
        if (! $business) {
            return false;
        }

        return $user->hasPermission($this->requiredPermission());
    }

    protected function prepareForValidation(): void
    {
        $merge = [];

        if ($this->has('client_first_name')) {
            $merge['client_first_name'] = $this->sanitizeBookingPlainText((string) $this->input('client_first_name'), 100);
        }
        if ($this->has('client_last_name')) {
            $merge['client_last_name'] = $this->sanitizeBookingPlainText((string) $this->input('client_last_name'), 100);
        }
        if ($this->has('client_notes')) {
            $merge['client_notes'] = $this->sanitizeBookingNotes((string) $this->input('client_notes'), 2000);
        }
        if ($this->has('client_phone')) {
            $merge['client_phone'] = $this->normalizeBookingPhone((string) $this->input('client_phone'));
        }
        if ($this->has('client_email')) {
            $merge['client_email'] = mb_strtolower(trim((string) $this->input('client_email')), 'UTF-8');
        }

        // Employee context: drop any client-supplied employee_id; the controller/service forces auth()->id().
        if ($this->isEmployeeContext()) {
            $merge['employee_id'] = (int) $this->user()->id;
        }

        $this->merge($merge);
    }

    public function rules(): array
    {
        $business = $this->user()?->panelBusiness();
        $identifierType = $business?->client_identifier_type ?? 'phone';

        $nameRegex = '/^[\p{L}\p{M}0-9\s\'.,-]+$/u';

        return [
            'client_first_name' => ['required', 'string', 'min:1', 'max:100', 'regex:'.$nameRegex],
            'client_last_name' => ['required', 'string', 'min:1', 'max:100', 'regex:'.$nameRegex],
            'client_phone' => $identifierType === 'phone'
                ? ['required', 'string', 'regex:/^\+?[0-9]{6,20}$/']
                : ['nullable', 'string', 'max:50'],
            'client_email' => $identifierType === 'email'
                ? ['required', 'string', 'email:rfc', 'max:255', 'regex:/^[^<>"\'`]+$/u']
                : ['nullable', 'string', 'max:255'],
            'client_notes' => ['nullable', 'string', 'max:2000', 'regex:/^[^<>]*$/u'],
            'employee_id' => $this->isEmployeeContext()
                ? ['nullable', 'integer']
                : ['required', 'integer', 'exists:users,id'],
            'service_ids' => ['required', 'array', 'min:1'],
            'service_ids.*' => ['integer', 'exists:services,id'],
            'date' => ['required', 'date_format:Y-m-d'],
            'start_time' => ['required', 'date_format:H:i'],
            'return_to' => ['nullable', 'string', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'client_first_name.regex' => __('request_messages.booking.client_first_name_regex'),
            'client_last_name.regex' => __('request_messages.booking.client_last_name_regex'),
            'client_phone.regex' => __('request_messages.booking.client_phone_regex'),
            'client_email.email' => __('request_messages.booking.client_email_invalid'),
            'client_notes.regex' => __('request_messages.booking.client_notes_regex'),
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $user = $this->user();
            if (! $user) {
                return;
            }
            $business = $user->panelBusiness();
            if (! $business) {
                return;
            }

            $employeeId = $this->isEmployeeContext()
                ? (int) $user->id
                : (int) $this->input('employee_id');

            $employeeBelongsToBusiness = User::where('id', $employeeId)
                ->where('business_id', $business->id)
                ->where('is_active', true)
                ->exists();

            if (! $employeeBelongsToBusiness) {
                $validator->errors()->add('employee_id', __('request_messages.booking.employee_invalid'));

                return;
            }

            $ids = array_values(array_unique(array_map('intval', (array) $this->input('service_ids', []))));
            if (count($ids) === 0) {
                return;
            }

            $validCount = Service::where('business_id', $business->id)
                ->where('is_active', true)
                ->whereIn('id', $ids)
                ->count();

            if ($validCount !== count($ids)) {
                $validator->errors()->add('service_ids', __('request_messages.booking.services_invalid'));

                return;
            }

            $employee = User::with(['services' => fn ($q) => $q->where('is_active', true)])->find($employeeId);
            foreach ($ids as $sid) {
                if (! $employee || ! $employee->services->contains('id', $sid)) {
                    $validator->errors()->add('service_ids', __('request_messages.booking.services_mismatch'));

                    break;
                }
            }
        });
    }

    public function isEmployeeContext(): bool
    {
        $name = (string) ($this->route()?->getName() ?? '');

        return str_starts_with($name, 'employee.');
    }

    private function requiredPermission(): string
    {
        return $this->isEmployeeContext()
            ? 'employee.appointments'
            : 'admin.appointments';
    }
}
