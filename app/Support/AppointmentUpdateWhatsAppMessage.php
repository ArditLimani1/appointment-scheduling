<?php

namespace App\Support;

use App\Models\Appointment;
use Carbon\Carbon;

class AppointmentUpdateWhatsAppMessage
{
    /**
     * @param  list<string>  $changes
     */
    public static function build(Appointment $appointment, string $notificationType, array $changes = []): string
    {
        $businessName = $appointment->business?->name ?? config('app.name', 'NiTermin');
        $serviceName = $appointment->service?->name;
        $employeeName = $appointment->employee?->name;

        $headline = match ($notificationType) {
            'cancelled' => "Your appointment with {$businessName} has been cancelled.",
            'confirmed' => "Your appointment with {$businessName} has been confirmed.",
            'rescheduled' => "Your appointment with {$businessName} has been rescheduled.",
            default => "Your appointment with {$businessName} has been updated.",
        };

        $lines = [$headline];

        if ($appointment->date) {
            $lines[] = 'Date: '.Carbon::parse($appointment->date)->format('d M Y');
        }

        if ($appointment->start_time && $appointment->end_time) {
            $lines[] = 'Time: '.self::formatTime((string) $appointment->start_time).' - '.self::formatTime((string) $appointment->end_time);
        }

        if ($serviceName) {
            $lines[] = 'Service: '.$serviceName;
        }

        if ($employeeName) {
            $lines[] = 'Staff: '.$employeeName;
        }

        $plainChanges = array_values(array_filter(array_map(
            static fn (string $change): string => trim(strip_tags($change)),
            $changes,
        )));

        if ($plainChanges !== []) {
            $lines[] = '';
            $lines[] = 'Changes:';

            foreach ($plainChanges as $change) {
                $lines[] = '- '.$change;
            }
        }

        return implode("\n", $lines);
    }

    private static function formatTime(string $time): string
    {
        return Carbon::parse($time)->format('H:i');
    }
}
