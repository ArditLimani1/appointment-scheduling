<?php

namespace App\Listeners;

use App\Events\AppointmentCustomerNotificationRequested;
use App\Mail\CustomerAppointmentUpdateMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendCustomerAppointmentUpdateEmail implements ShouldQueue
{
    use InteractsWithQueue;

    public bool $afterCommit = true;

    public function tries(): int
    {
        return 5;
    }

    /**
     * Back off more aggressively because Mailtrap sandbox throttles rapid sends.
     *
     * @return list<int>
     */
    public function backoff(): array
    {
        return [2, 5, 10, 20];
    }

    public function handle(AppointmentCustomerNotificationRequested $event): void
    {
        $appointment = $event->appointment->loadMissing(['business.owner', 'employee', 'service']);

        if (! filled($appointment->client_email)) {
            return;
        }

        $locale = $appointment->employee?->locale
            ?: $appointment->business?->owner?->locale
            ?: app()->getLocale();

        Mail::to($appointment->client_email)->send(
            (new CustomerAppointmentUpdateMail(
                $appointment,
                $event->notificationType,
                $event->changes,
            ))->locale($locale)
        );
    }

    public function failed(AppointmentCustomerNotificationRequested $event, Throwable $exception): void
    {
        report($exception);
    }
}
