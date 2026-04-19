<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('business_type_categories', function (Blueprint $table) {
            $table->string('name_sq')->nullable()->after('name');
        });

        Schema::table('business_types', function (Blueprint $table) {
            $table->string('name_sq')->nullable()->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('business_type_categories', function (Blueprint $table) {
            $table->dropColumn('name_sq');
        });

        Schema::table('business_types', function (Blueprint $table) {
            $table->dropColumn('name_sq');
        });
    }
};
