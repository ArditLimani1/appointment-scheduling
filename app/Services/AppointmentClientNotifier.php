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
 * There is no fallback — a phone business never emails, an email business never sends
 * WhatsApp — because only one of the two fields is collected at booking time.
 *
 * Both channels carry the same set of events, so behaviour does not depend on the
 * channel, the actor's role, or which screen the change was made from.
 */
class AppointmentClientNotifier
{
    public const CONFIRMED = 'confirmed';

    public const CANCELLED = 'cancelled';

    public const RESCHEDULED = 'rescheduled';

    public const CHANGED = 'changed';

    public function __construct(private WhatsAppSenderInterface $whatsApp) {}

    /**
     * @param  list<array{type:string,from:?string,to:?string}>  $changes  Email-only detail lines.
     */
    public function notify(?Appointment $appointment, string $type, array $changes = []): void
    {
        if (! $appointment instanceof Appointment) {
            return;
        }

        $appointment->loadMissing(['business', 'employee', 'service']);

        $channel = ClientIdentification::resolve($appointment->business?->client_identifier_type);

        if ($channel === 'email') {
            $this->sendEmail($appointment, $type, $changes);

            return;
        }

        $this->sendWhatsApp($appointment, $type);
    }

    /**
     * @param  list<array{type:string,from:?string,to:?string}>  $changes
     */
    private function sendEmail(Appointment $appointment, string $type, array $changes): void
    {
        if (! filled($appointment->client_email)) {
            return;
        }

        event(new AppointmentCustomerNotificationRequested($appointment, $type, $changes));
    }

    private function sendWhatsApp(Appointment $appointment, string $type): void
    {
        $phone = trim((string) ($appointment->client_phone ?? ''));
        if ($phone === '' || ! $this->whatsApp->isConfigured()) {
            return;
        }

        [$businessName, $date, $time, $contact] = AppointmentWhatsAppParams::fromAppointment($appointment);

        match ($type) {
            self::CONFIRMED => $this->whatsApp->sendBookingConfirmation($phone, $businessName, $date, $time, $contact),
            self::CANCELLED => $this->whatsApp->sendBookingCancellation($phone, $businessName, $date, $time, $contact),
            self::RESCHEDULED, self::CHANGED => $this->whatsApp->sendBookingUpdate($phone, $businessName, $date, $time, $contact),
            default => null,
        };
    }
}
