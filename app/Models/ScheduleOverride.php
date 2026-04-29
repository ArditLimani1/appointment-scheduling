<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ScheduleOverride extends Model
{
    protected $fillable = [
        'user_id', 'date', 'is_active', 'start_time', 'end_time',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'date' => 'date:Y-m-d',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function breaks(): HasMany
    {
        return $this->hasMany(ScheduleOverrideBreak::class);
    }
}
