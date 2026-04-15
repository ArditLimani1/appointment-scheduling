<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table): void {
            $table->boolean('allow_employee_service_edit')
                ->default(true)
                ->after('client_identifier_type');
        });
    }

    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table): void {
            $table->dropColumn('allow_employee_service_edit');
        });
    }
};
