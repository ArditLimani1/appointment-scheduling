<?php

namespace App\Services;

use App\Events\AppointmentCustomerNotificationRequested;
use App\Models\Appointment;
use App\Services\Interfaces\WhatsAppSenderInterface;
use App\Support\AppointmentWhatsAppParams;
use App\Support\ClientIdentification;

/**
 * Single entry point for every client-facing appointment notification.
 *
 * The business picks one channel in settings (`client_identifier_type`): clients are
 * identified by phone or by email, and that same choice decides where notifications go.
 * The configured channel is preferred. If the business changed channels after an
 * appointment was booked, the appointment's existing contact is used as a fallback
 * so confirmations and reminders are not silently lost.
 *
 * Both channels carry the same set of events - including the day-of reminder - so
 * behaviour does not depend on the channel, the actor's role, or which screen the
 * change was made from.
 */
class AppointmentClientNotifier
{
    public const CONFIRMED = 'confirmed';

    public const CANCELLED = 'cancelled';

    public const RESCHEDULED = 'rescheduled';

    public const CHANGED = 'changed';

    public const REMINDER = 'reminder';

    public function __construct(private WhatsAppSenderInterface $whatsApp) {}

    /**
     * @param  list<array{type:string,from:?string,to:?string}>  $changes  Email-only detail lines.
     */
    public function notify(?Appointment $appointment, string $type, array $changes = []): bool
    {
        if (! $appointment instanceof Appointment) {
            return false;
        }

        $appointment->loadMissing(['business', 'employee', 'service']);

        if ($this->channelFor($appointment) === 'email') {
            return $this->sendEmail($appointment, $type, $changes);
        }

        return $this->sendWhatsApp($appointment, $type);
    }

    /**
     * The channel a given appointment's business notifies on: 'email' or 'phone'.
     */
    public function channelFor(Appointment $appointment): string
    {
        $configuredChannel = ClientIdentification::resolve($appointment->business?->client_identifier_type);

        if ($configuredChannel === 'phone' && filled($appointment->client_phone)) {
            return 'phone';
        }

        if ($configuredChannel === 'email' && filled($appointment->client_email)) {
            return 'email';
        }

        if (filled($appointment->client_phone)) {
            return 'phone';
        }

        if (filled($appointment->client_email)) {
            return 'email';
        }

        return $configuredChannel;
    }

    /**
     * @param  list<array{type:string,from:?string,to:?string}>  $changes
     */
    private function sendEmail(Appointment $appointment, string $type, array $changes): bool
    {
        if (! filled($appointment->client_email)) {
            return false;
        }

        event(new AppointmentCustomerNotificationRequested($appointment, $type, $changes));

        return true;
    }

    private function sendWhatsApp(Appointment $appointment, string $type): bool
    {
        $phone = trim((string) ($appointment->client_phone ?? ''));
        if ($phone === '' || ! $this->whatsApp->isConfigured()) {
            return false;
        }

        [$businessName, $serviceName, $employeeName, $date, $time, $contact] = AppointmentWhatsAppParams::fromAppointment($appointment);

        return (bool) match ($type) {
            self::CONFIRMED => $this->whatsApp->sendBookingConfirmation($phone, $businessName, $serviceName, $employeeName, $date, $time, $contact),
            self::CANCELLED => $this->whatsApp->sendBookingCancellation($phone, $businessName, $serviceName, $employeeName, $date, $time, $contact),
            self::RESCHEDULED, self::CHANGED => $this->whatsApp->sendBookingUpdate($phone, $businessName, $serviceName, $employeeName, $date, $time, $contact),
            self::REMINDER => $this->whatsApp->sendBookingReminder($phone, $businessName, $serviceName, $employeeName, $date, $time, $contact),
            default => false,
        };
    }
}
