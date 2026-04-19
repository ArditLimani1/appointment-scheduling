<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Default true preserves behaviour for existing businesses that may already use shared resources.
     */
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->boolean('uses_shared_resources')->default(true)->after('allow_employee_service_edit');
        });
    }

    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn('uses_shared_resources');
        });
    }
};
