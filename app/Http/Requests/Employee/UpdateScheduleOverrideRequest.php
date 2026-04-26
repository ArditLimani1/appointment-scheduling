<?php

namespace App\Http\Requests\Employee;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateScheduleOverrideRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'success_context'              => ['required', 'string', Rule::in(['day_on', 'day_off', 'break_added', 'break_updated', 'break_removed', 'day_time_updated'])],
            'days'                         => ['required', 'array'],
            'days.*.date'                  => ['required', 'date_format:Y-m-d'],
            'days.*.is_active'             => ['required', 'boolean'],
            'days.*.is_overridden'         => ['required', 'boolean'],
            'days.*.start_time'            => ['nullable', 'date_format:H:i'],
            'days.*.end_time'              => ['nullable', 'date_format:H:i'],
            'days.*.breaks'                => ['nullable', 'array'],
            'days.*.breaks.*.start_time'   => ['required', 'date_format:H:i'],
            'days.*.breaks.*.end_time'     => ['required', 'date_format:H:i'],
        ];
    }
}
