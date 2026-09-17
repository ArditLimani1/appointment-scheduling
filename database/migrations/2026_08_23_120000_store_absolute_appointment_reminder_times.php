<?php

use Carbon\Carbon;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('businesses', 'reminder_hours_before')) {
            Schema::table('businesses', function (Blueprint $table): void {
                $table->unsignedInteger('reminder_hours_before')->default(24)->after('reminders_enabled');
            });
        }

        if (! Schema::hasColumn('appointments', 'reminder_at')) {
            Schema::table('appointments', function (Blueprint $table): void {
                $table->timestamp('reminder_at')->nullable()->after('status');
            });
        }

        if (! $this->indexExists('appointments', 'appointments_due_reminders_index')) {
            Schema::table('appointments', function (Blueprint $table): void {
                $table->index(['status', 'reminder_sent_at', 'reminder_at'], 'appointments_due_reminders_index');
            });
        }

        DB::table('appointments')
            ->join('businesses', 'businesses.id', '=', 'appointments.business_id')
            ->select('appointments.id', 'appointments.date', 'appointments.start_time', 'businesses.timezone')
            ->whereNull('appointments.reminder_at')
            ->orderBy('appointments.id')
            ->chunk(500, function ($appointments): void {
                foreach ($appointments as $appointment) {
                    $timezone = $appointment->timezone ?: config('app.timezone');
                    $date = Carbon::parse($appointment->date, $timezone)->toDateString();
                    $reminderAt = Carbon::parse(
                        $date.' '.$appointment->start_time,
                        $timezone,
                    )->subHours(24)->setTimezone(config('app.timezone'));

                    DB::table('appointments')->where('id', $appointment->id)->update([
                        'reminder_at' => $reminderAt,
                    ]);
                }
            });

        if (Schema::hasColumn('businesses', 'reminder_time')) {
            Schema::table('businesses', function (Blueprint $table): void {
                $table->dropColumn('reminder_time');
            });
        }
    }

    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table): void {
            $table->time('reminder_time')->default('08:00:00')->after('reminders_enabled');
        });

        Schema::table('appointments', function (Blueprint $table): void {
            $table->dropIndex('appointments_due_reminders_index');
            $table->dropColumn('reminder_at');
        });

        Schema::table('businesses', function (Blueprint $table): void {
            $table->dropColumn('reminder_hours_before');
        });
    }

    private function indexExists(string $table, string $index): bool
    {
        $connection = Schema::getConnection();

        if ($connection->getDriverName() === 'sqlite') {
            $indexes = $connection->select("PRAGMA index_list('{$table}')");

            return collect($indexes)->contains(fn ($row) => ($row->name ?? null) === $index);
        }

        return collect(Schema::getIndexes($table))->contains(fn (array $idx) => ($idx['name'] ?? null) === $index);
    }
};
