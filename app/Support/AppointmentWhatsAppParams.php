<?php

namespace App\Support;

use App\Models\Appointment;
use Carbon\Carbon;

class AppointmentWhatsAppParams
{
    /**
     * WhatsApp template body parameters, in order:
     * [businessName, serviceName, employeeName, date, time, contact].
     *
     * Date is localised to Albanian (e.g. "28 korrik 2026"). Contact falls
     * back from the business phone to its email so the variable is never empty.
     *
     * @return array{0: string, 1: string, 2: string, 3: string, 4: string, 5: string}
     */
    public static function fromAppointment(Appointment $appointment): array
    {
        $business = $appointment->business;

        $businessName = (string) ($business?->name ?? '');
        $serviceName = (string) ($appointment->service?->name ?? '');
        $employeeName = (string) ($appointment->employee?->name ?? '');
        $date = $appointment->date
            ? $appointment->date->locale('sq')->translatedFormat('d F Y')
            : '';
        $time = $appointment->start_time ? Carbon::parse($appointment->start_time)->format('H:i') : '';
        $contact = (string) ($business?->phone ?: ($business?->email ?? ''));

        return [$businessName, $serviceName, $employeeName, $date, $time, $contact];
    }
}
