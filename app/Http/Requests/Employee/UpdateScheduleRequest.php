<?php

namespace App\Http\Requests\Employee;

use Illuminate\Foundation\Http\FormRequest;

class UpdateScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'schedules' => ['required', 'array'],
            'schedules.*.day_of_week' => ['required', 'integer', 'min:0', 'max:6'],
            'schedules.*.start_time' => ['nullable', 'date_format:H:i'],
            'schedules.*.end_time' => ['nullable', 'date_format:H:i', 'after:schedules.*.start_time'],
            'schedules.*.is_active' => ['required', 'boolean'],
            'schedules.*.breaks' => ['nullable', 'array'],
            'schedules.*.breaks.*.start_time' => ['required', 'date_format:H:i'],
            'schedules.*.breaks.*.end_time' => ['required', 'date_format:H:i', 'after:schedules.*.breaks.*.start_time'],
        ];
    }
}
