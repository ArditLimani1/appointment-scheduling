<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Reminders are no longer WhatsApp-only: the channel follows the business
 * `client_identifier_type`, so the flag loses its channel-specific name.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->renameColumn('whatsapp_reminders_enabled', 'reminders_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->renameColumn('reminders_enabled', 'whatsapp_reminders_enabled');
        });
    }
};
