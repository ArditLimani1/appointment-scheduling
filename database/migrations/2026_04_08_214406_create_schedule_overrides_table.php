<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedule_overrides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->boolean('is_active')->default(true);
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'date']);
        });

        Schema::create('schedule_override_breaks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schedule_override_id')
                ->constrained('schedule_overrides')
                ->cascadeOnDelete();
            $table->time('start_time');
            $table->time('end_time');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedule_override_breaks');
        Schema::dropIfExists('schedule_overrides');
    }
};
