<?php

namespace App\Support;

use App\Models\Appointment;

class AppointmentUpdateNotificationChannel
{
    public static function for(Appointment $appointment): string
    {
        $appointment->loadMissing('business');

        return $appointment->business?->client_identifier_type === 'email'
            ? 'mail'
            : 'whatsapp';
    }

    public static function hasRecipient(Appointment $appointment): bool
    {
        return match (self::for($appointment)) {
            'mail' => filled($appointment->client_email),
            default => filled($appointment->client_phone),
        };
    }
}
