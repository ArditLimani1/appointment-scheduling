<?php

namespace App\Http\Requests\Admin;

use App\Enums\AppointmentStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAppointmentStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user || ! $user->hasPermission('admin.appointments')) {
            return false;
        }

        $business = $user->panelBusiness();
        $appointment = $this->route('appointment');

        return $business && $appointment && (int) $appointment->business_id === (int) $business->id;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(AppointmentStatus::class)],
        ];
    }
}
