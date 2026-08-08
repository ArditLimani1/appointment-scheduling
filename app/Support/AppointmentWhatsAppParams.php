<?php

namespace App\Support;

use App\Models\Appointment;

class AppointmentWhatsAppParams
{
    /**
     * WhatsApp template body parameters, in order:
     * [businessName, date, time, contact].
     *
     * Date is localised to Albanian (e.g. "28 korrik 2026"). Contact falls
     * back from the business phone to its email so the variable is never empty.
     *
     * @return array{0: string, 1: string, 2: string, 3: string}
     */
    public static function fromAppointment(Appointment $appointment): array
    {
        $business = $appointment->business;

        $businessName = (string) ($business?->name ?? '');
        $date = $appointment->date
            ? $appointment->date->locale('sq')->translatedFormat('d F Y')
            : '';
        $time = (string) $appointment->start_time;
        $contact = (string) ($business?->phone ?: ($business?->email ?? ''));

        return [$businessName, $date, $time, $contact];
    }
}
