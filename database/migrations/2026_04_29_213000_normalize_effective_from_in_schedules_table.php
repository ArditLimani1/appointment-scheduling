<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * SQLite preserves whatever string we wrote, so earlier runs that relied on
     * Eloquent's default date cast may have stored `YYYY-MM-DD HH:MM:SS` for
     * `effective_from`. The application now always writes `Y-m-d` and looks up
     * rows with `Y-m-d` strings (e.g. via `updateOrCreate`), so the previously
     * stored datetime values would never match and trigger a unique-constraint
     * INSERT instead of an UPDATE. Trim everything down to a date-only string.
     */
    public function up(): void
    {
        DB::table('schedules')->update([
            'effective_from' => DB::raw('substr(effective_from, 1, 10)'),
        ]);
    }

    public function down(): void
    {
        // No-op: trimming time components is a one-way data fix.
    }
};
