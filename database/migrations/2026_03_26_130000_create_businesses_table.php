<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('businesses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('location')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('description')->nullable();
            $table->string('logo')->nullable();
            $table->string('timezone')->default('UTC');
            $table->string('currency')->default('EUR');
            $table->string('currency_symbol')->default('€');
            $table->integer('slot_duration')->default(30);
            $table->integer('min_booking_notice')->default(120);
            $table->integer('max_booking_window')->default(30);
            $table->boolean('services_enabled')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('businesses');
    }
};
