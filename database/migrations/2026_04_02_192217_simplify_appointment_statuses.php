<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Map removed statuses to their nearest equivalent
        DB::table('appointments')
            ->whereIn('status', ['checked_in', 'completed'])
            ->update(['status' => 'confirmed']);

        // Re-define the column with only the three allowed values
        Schema::table('appointments', function (Blueprint $table) {
            $table->string('status')->default('pending')->change();
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->string('status')->default('pending')->change();
        });
    }
};
