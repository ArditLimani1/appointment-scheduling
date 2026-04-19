<?php

namespace App\Http\Requests\Booking;

use App\Models\Business;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
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

        $this->merge($merge);
    }

    public function rules(): array
    {
        $business = Business::where('slug', $this->route('slug'))->first();
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
            'employee_id' => ['required', 'integer', 'exists:users,id'],
            'service_ids' => ['required', 'array', 'min:1'],
            'service_ids.*' => ['integer', 'exists:services,id'],
            'date' => ['required', 'date_format:Y-m-d'],
            'start_time' => ['required', 'date_format:H:i'],
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
                    $validator->errors()->add('date', __('request_messages.booking.date_past'));
                }

                $maxDay = Carbon::now($timezone)->startOfDay()
                    ->addDays((int) ($business->max_booking_window ?? 30));
                if ($requestDay->gt($maxDay)) {
                    $validator->errors()->add('date', __('request_messages.booking.date_window'));
                }
            }

            $startTimeInput = $this->input('start_time');
            if ($dateInput && $startTimeInput) {
                $start = Carbon::parse($dateInput.' '.$startTimeInput, $timezone);
                $earliest = Carbon::now($timezone)->addMinutes((int) ($business->min_booking_notice ?? 0));
                if ($start->lt($earliest)) {
                    $validator->errors()->add(
                        'start_time',
                        __('request_messages.booking.start_time_notice')
                    );
                }
            }

            $employeeId = (int) $this->input('employee_id');
            $ids = array_values(array_unique(array_map('intval', $this->input('service_ids', []))));

            $employeeBelongsToBusiness = User::where('id', $employeeId)
                ->where('business_id', $business->id)
                ->where('is_active', true)
                ->exists();

            if (! $employeeBelongsToBusiness) {
                $validator->errors()->add('employee_id', __('request_messages.booking.employee_invalid'));
            }

            if (count($ids) === 0) {
                return;
            }

            $validCount = Service::where('business_id', $business->id)
                ->where('is_active', true)
                ->whereIn('id', $ids)
                ->count();

            if ($validCount !== count($ids)) {
                $validator->errors()->add('service_ids', __('request_messages.booking.services_invalid'));
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

    private function sanitizeBookingPlainText(string $value, int $max): string
    {
        $value = strip_tags($value);
        $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';

        return mb_substr(trim($value), 0, $max, 'UTF-8');
    }

    private function sanitizeBookingNotes(string $value, int $max): string
    {
        $value = str_replace(["\r\n", "\r"], "\n", $value);

        return $this->sanitizeBookingPlainText($value, $max);
    }

    private function normalizeBookingPhone(string $value): string
    {
        $value = trim($value);
        $digits = preg_replace('/\D+/', '', $value) ?? '';
        if ($digits === '') {
            return '';
        }

        return str_starts_with($value, '+') ? '+'.$digits : $digits;
    }
}
