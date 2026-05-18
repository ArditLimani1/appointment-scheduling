<?php

namespace App\Listeners;

use App\Events\AppointmentCustomerNotificationRequested;
use App\Services\TwilioWhatsAppClient;
use App\Support\AppointmentUpdateNotificationChannel;
use App\Support\AppointmentUpdateWhatsAppMessage;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Throwable;

class SendCustomerAppointmentUpdateWhatsApp implements ShouldQueue
{
    use InteractsWithQueue;

    public bool $afterCommit = true;

    public function __construct(
        private readonly TwilioWhatsAppClient $client,
    ) {}

    public function shouldQueue(AppointmentCustomerNotificationRequested $event): bool
    {
        $appointment = $event->appointment->loadMissing(['business', 'employee', 'service']);

        return AppointmentUpdateNotificationChannel::for($appointment) === 'whatsapp'
            && filled($appointment->client_phone);
    }

    public function tries(): int
    {
        return 5;
    }

    /**
     * @return list<int>
     */
    public function backoff(): array
    {
        return [2, 5, 10, 20];
    }

    public function handle(AppointmentCustomerNotificationRequested $event): void
    {
        $appointment = $event->appointment->loadMissing(['business', 'employee', 'service']);

        if (AppointmentUpdateNotificationChannel::for($appointment) !== 'whatsapp' || ! filled($appointment->client_phone)) {
            return;
        }

        $this->client->sendMessage((string) $appointment->client_phone, [
            'Body' => AppointmentUpdateWhatsAppMessage::build(
                $appointment,
                $event->notificationType,
                $event->changes,
            ),
        ]);
    }

    public function failed(AppointmentCustomerNotificationRequested $event, Throwable $exception): void
    {
        report($exception);
    }
}
