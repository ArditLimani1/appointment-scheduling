<?php

namespace App\Support;

use App\Models\Appointment;
use App\Models\Business;
use Carbon\Carbon;

class AppointmentReminder
{
    public static function at(Appointment $appointment, Business $business): Carbon
    {
        $timezone = $business->timezone ?: config('app.timezone');
        $hoursBefore = max(0, (int) ($business->reminder_hours_before ?? 24));

        return Carbon::parse(
            $appointment->date->format('Y-m-d').' '.$appointment->start_time,
            $timezone,
        )->subHours($hoursBefore)->setTimezone(config('app.timezone'));
    }
}
