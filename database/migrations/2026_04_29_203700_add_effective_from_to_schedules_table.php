<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            $table->date('effective_from')->default('2000-01-01')->after('day_of_week');
        });

        Schema::table('schedules', function (Blueprint $table) {
            $table->dropUnique('schedules_user_id_day_of_week_unique');
            $table->unique(['user_id', 'day_of_week', 'effective_from'], 'schedules_user_day_effective_unique');
            $table->index(['user_id', 'day_of_week', 'effective_from'], 'schedules_user_day_effective_idx');
        });
    }

    public function down(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            $table->dropIndex('schedules_user_day_effective_idx');
            $table->dropUnique('schedules_user_day_effective_unique');
            $table->unique(['user_id', 'day_of_week']);
            $table->dropColumn('effective_from');
        });
    }
};
