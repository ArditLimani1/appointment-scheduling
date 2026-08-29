<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Per-user opt-in: receive the "new appointment" notification for appointments
     * assigned to *other* staff. Off by default — only users who hold
     * `admin.appointments` can turn it on, each for themselves.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('notify_others_appointments')->default(false)->after('also_works_as_staff');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('notify_others_appointments');
        });
    }
};
