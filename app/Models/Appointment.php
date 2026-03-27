<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Appointment extends Model
{
    protected $fillable = [
        'business_id', 'employee_id', 'service_id', 'client_first_name', 'client_last_name',
        'client_phone', 'client_notes', 'date', 'start_time', 'end_time',
        'price', 'status',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'price' => 'decimal:2',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function getClientFullNameAttribute(): string
    {
        return $this->client_first_name . ' ' . $this->client_last_name;
    }
}
