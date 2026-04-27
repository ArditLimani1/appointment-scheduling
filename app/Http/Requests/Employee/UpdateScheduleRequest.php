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
            'schedules.*.end_time' => [
                'nullable',
                'date_format:H:i',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $startPath = str_replace('.end_time', '.start_time', $attribute);
                    $startTime = data_get($this->all(), $startPath);

                    if ($startTime && $value && $value <= $startTime) {
                        $fail(__('request_messages.schedule.end_time_after_start'));
                    }
                },
            ],
            'schedules.*.is_active' => ['required', 'boolean'],
            'schedules.*.breaks' => ['nullable', 'array'],
            'schedules.*.breaks.*.start_time' => ['required', 'date_format:H:i'],
            'schedules.*.breaks.*.end_time' => [
                'required',
                'date_format:H:i',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $startPath = str_replace('.end_time', '.start_time', $attribute);
                    $startTime = data_get($this->all(), $startPath);

                    if ($startTime && $value && $value <= $startTime) {
                        $fail(__('request_messages.schedule.break_end_after_start'));
                    }
                },
            ],
        ];
    }
}
