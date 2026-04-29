<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Schedule extends Model
{
    protected $fillable = [
        'user_id', 'day_of_week', 'effective_from', 'start_time', 'end_time', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * Always persist `effective_from` as a `Y-m-d` string (no time component).
     *
     * SQLite stores DATE columns as raw text; the default Eloquent date cast writes
     * `Y-m-d H:i:s`, which then never matches the `Y-m-d` strings we use for
     * lookups (e.g. `updateOrCreate(['effective_from' => '2026-04-30'])`). That
     * mismatch caused subsequent updates of the same weekly schedule to attempt a
     * fresh INSERT and trip the (user_id, day_of_week, effective_from) unique
     * constraint. Reads still return a Carbon instance for ergonomic date math.
     */
    protected function effectiveFrom(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value ? Carbon::parse($value)->startOfDay() : null,
            set: fn ($value) => $value
                ? ($value instanceof \DateTimeInterface
                    ? $value->format('Y-m-d')
                    : Carbon::parse($value)->format('Y-m-d'))
                : null,
        );
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function breaks(): HasMany
    {
        return $this->hasMany(ScheduleBreak::class);
    }

    public static function dayName(int $day): string
    {
        return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][$day] ?? '';
    }
}
