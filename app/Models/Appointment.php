<?php

namespace App\Models;

use App\Enums\AppointmentStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Appointment extends Model
{
    protected $fillable = [
        'booking_reference', 'business_id', 'employee_id', 'service_id', 'client_first_name', 'client_last_name',
        'client_phone', 'client_email', 'client_notes', 'date', 'start_time', 'end_time',
        'price', 'status', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'price' => 'decimal:2',
            'status' => AppointmentStatus::class,
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

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function sharedResources(): BelongsToMany
    {
        return $this->belongsToMany(SharedResource::class, 'appointment_shared_resources', 'appointment_id', 'shared_resource_id')
            ->withPivot('quantity')
            ->withTimestamps();
    }

    public function getClientFullNameAttribute(): string
    {
        return $this->client_first_name.' '.$this->client_last_name;
    }
}
