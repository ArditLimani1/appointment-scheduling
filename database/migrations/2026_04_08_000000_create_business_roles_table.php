<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->json('permissions');
            $table->timestamps();

            $table->unique(['business_id', 'name']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('business_role_id')->nullable()->after('business_id')->constrained('business_roles')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['business_role_id']);
            $table->dropColumn('business_role_id');
        });

        Schema::dropIfExists('business_roles');
    }
};
