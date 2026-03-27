<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_settings', function (Blueprint $table) {
            $table->id();
            $table->string('business_name')->default('Stratos Scheduler');
            $table->string('slug')->unique()->default('stratos');
            $table->integer('slot_duration')->default(30); // minutes
            $table->integer('min_booking_notice')->default(120); // minutes (2 hours)
            $table->integer('max_booking_window')->default(30); // days
            $table->boolean('services_enabled')->default(true);
            $table->string('timezone')->default('Europe/Berlin');
            $table->string('currency')->default('EUR');
            $table->string('currency_symbol')->default('€');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_settings');
    }
};
