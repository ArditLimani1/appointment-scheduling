<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('appointment_shared_resources')) {
            Schema::create('appointment_shared_resources', function (Blueprint $table) {
                $table->id();
                $table->foreignId('appointment_id')->constrained()->cascadeOnDelete();
                $table->foreignId('shared_resource_id')->constrained('shared_resources')->restrictOnDelete();
                $table->unsignedInteger('quantity');
                $table->timestamps();

                $table->index(['shared_resource_id', 'appointment_id'], 'asr_resource_appointment_idx');
            });

            return;
        }

        Schema::table('appointment_shared_resources', function (Blueprint $table) {
            $table->index(['shared_resource_id', 'appointment_id'], 'asr_resource_appointment_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointment_shared_resources');
    }
};
