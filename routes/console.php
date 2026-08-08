<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Send WhatsApp appointment reminders. Runs every 15 minutes so each business's
// chosen reminder time (any HH:MM) is honoured; the reminder_sent_at guard makes
// re-runs idempotent.
Schedule::command('whatsapp:send-reminders')->everyFifteenMinutes();
