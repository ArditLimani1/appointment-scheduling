<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduleOverrideBreak extends Model
{
    protected $fillable = [
        'schedule_override_id', 'start_time', 'end_time',
    ];

    public function override(): BelongsTo
    {
        return $this->belongsTo(ScheduleOverride::class, 'schedule_override_id');
    }
}
