<?php

namespace App\Console\Commands;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Business;
use App\Services\Interfaces\WhatsAppSenderInterface;
use App\Support\AppointmentWhatsAppParams;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendWhatsAppReminders extends Command
{
    protected $signature = 'whatsapp:send-reminders';

    protected $description = 'Send WhatsApp reminders to clients with a confirmed appointment today, once each business reaches its configured reminder time.';

    public function handle(WhatsAppSenderInterface $whatsApp): int
    {
        if (! $whatsApp->isConfigured()) {
            $this->warn('WhatsApp is not configured; skipping reminders.');

            return self::SUCCESS;
        }

        $sent = 0;

        Business::query()
            ->where('whatsapp_reminders_enabled', true)
            ->each(function (Business $business) use ($whatsApp, &$sent): void {
                $timezone = $business->timezone ?: config('app.timezone');
                $now = Carbon::now($timezone);

                // Only start sending once the business's local time has reached its reminder time.
                if ($now->format('H:i') < $business->reminder_time) {
                    return;
                }

                $appointments = Appointment::query()
                    ->where('business_id', $business->id)
                    ->whereDate('date', $now->toDateString())
                    ->where('status', AppointmentStatus::Confirmed)
                    ->whereNull('reminder_sent_at')
                    ->whereNotNull('client_phone')
                    ->where('client_phone', '!=', '')
                    ->where('start_time', '>=', $now->format('H:i'))
                    ->get();

                foreach ($appointments as $appointment) {
                    $appointment->setRelation('business', $business);
                    [$businessName, $date, $time, $contact] = AppointmentWhatsAppParams::fromAppointment($appointment);

                    $ok = $whatsApp->sendBookingReminder(
                        (string) $appointment->client_phone,
                        $businessName,
                        $date,
                        $time,
                        $contact,
                    );

                    if ($ok) {
                        $appointment->forceFill(['reminder_sent_at' => now()])->save();
                        $sent++;
                    }
                }
            });

        $this->info("WhatsApp reminders sent: {$sent}");

        return self::SUCCESS;
    }
}
