<?php

namespace App\Console\Commands;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Business;
use App\Services\AppointmentClientNotifier;
use App\Services\Interfaces\WhatsAppSenderInterface;
use App\Support\ClientIdentification;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendAppointmentReminders extends Command
{
    protected $signature = 'appointments:send-reminders';

    protected $description = 'Remind clients with a confirmed appointment today, once each business reaches its configured reminder time. The channel follows the business client identification setting: phone sends WhatsApp, email sends mail.';

    public function handle(AppointmentClientNotifier $notifier, WhatsAppSenderInterface $whatsApp): int
    {
        $sent = 0;
        $skippedWhatsApp = 0;

        Business::query()
            ->where('reminders_enabled', true)
            ->each(function (Business $business) use ($notifier, $whatsApp, &$sent, &$skippedWhatsApp): void {
                $timezone = $business->timezone ?: config('app.timezone');
                $now = Carbon::now($timezone);

                // Only start sending once the business's local time has reached its reminder time.
                if ($now->format('H:i') < $business->reminder_time) {
                    return;
                }

                $usesWhatsApp = ClientIdentification::resolve($business->client_identifier_type) === 'phone';

                if ($usesWhatsApp && ! $whatsApp->isConfigured()) {
                    $skippedWhatsApp++;

                    return;
                }

                $contactColumn = $usesWhatsApp ? 'client_phone' : 'client_email';

                $appointments = Appointment::query()
                    ->where('business_id', $business->id)
                    ->whereDate('date', $now->toDateString())
                    ->where('status', AppointmentStatus::Confirmed)
                    ->whereNull('reminder_sent_at')
                    ->whereNotNull($contactColumn)
                    ->where($contactColumn, '!=', '')
                    ->where('start_time', '>=', $now->format('H:i'))
                    ->get();

                foreach ($appointments as $appointment) {
                    $appointment->setRelation('business', $business);

                    if ($notifier->notify($appointment, AppointmentClientNotifier::REMINDER)) {
                        $appointment->forceFill(['reminder_sent_at' => now()])->save();
                        $sent++;
                    }
                }
            });

        if ($skippedWhatsApp > 0) {
            $this->warn("WhatsApp is not configured; skipped {$skippedWhatsApp} business(es) that notify by phone.");
        }

        $this->info("Appointment reminders sent: {$sent}");

        return self::SUCCESS;
    }
}
