<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('service_id')->nullable()->constrained()->onDelete('set null');
            $table->string('client_first_name');
            $table->string('client_last_name');
            $table->string('client_phone');
            $table->text('client_notes')->nullable();
            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');
            $table->decimal('price', 8, 2)->default(0);
            $table->enum('status', ['pending', 'confirmed', 'checked_in', 'completed', 'cancelled'])->default('confirmed');
            $table->timestamps();

            $table->index(['employee_id', 'date']);
            $table->index(['date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
