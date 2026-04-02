<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->string('client_identifier_type')->default('phone')->after('services_enabled');
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->string('client_email')->nullable()->after('client_phone');
            $table->string('client_phone')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn('client_identifier_type');
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn('client_email');
            $table->string('client_phone')->nullable(false)->change();
        });
    }
};
