<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table): void {
            $table->boolean('whatsapp_reminders_enabled')->default(false)->after('auto_confirm_appointments');
            $table->time('reminder_time')->default('08:00:00')->after('whatsapp_reminders_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table): void {
            $table->dropColumn(['whatsapp_reminders_enabled', 'reminder_time']);
        });
    }
};
