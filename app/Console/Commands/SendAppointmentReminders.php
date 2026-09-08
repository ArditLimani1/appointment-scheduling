<?php

namespace App\Console\Commands;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Services\AppointmentClientNotifier;
use App\Support\ClientIdentification;
use Illuminate\Console\Command;

class SendAppointmentReminders extends Command
{
    protected $signature = 'appointments:send-reminders';

    protected $description = 'Send reminders for confirmed appointments whose per-business reminder time is due.';

    public function handle(AppointmentClientNotifier $notifier): int
    {
        $sent = 0;

        Appointment::query()
            ->with(['business', 'employee', 'service'])
            ->where('status', AppointmentStatus::Confirmed)
            ->whereNull('reminder_sent_at')
            ->whereNotNull('reminder_at')
            ->where('reminder_at', '<=', now())
            ->whereHas('business', fn ($query) => $query->where('reminders_enabled', true))
            ->eachById(function (Appointment $appointment) use ($notifier, &$sent): void {
                $contactColumn = ClientIdentification::resolve($appointment->business?->client_identifier_type) === 'phone'
                    ? 'client_phone'
                    : 'client_email';

                if (! filled($appointment->{$contactColumn})) {
                    return;
                }

                if ($notifier->notify($appointment, AppointmentClientNotifier::REMINDER)) {
                    $appointment->forceFill(['reminder_sent_at' => now()])->saveQuietly();
                    $sent++;
                }
            }, 500);

        $this->info("Appointment reminders sent: {$sent}");

        return self::SUCCESS;
    }
}
