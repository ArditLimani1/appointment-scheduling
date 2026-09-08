<?php

namespace App\Models;

use App\Enums\AppointmentStatus;
use App\Support\AppointmentReminder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Appointment extends Model
{
    protected $fillable = [
        'booking_reference', 'business_id', 'employee_id', 'employee_name', 'service_id', 'service_name', 'client_first_name', 'client_last_name',
        'client_phone', 'client_email', 'client_notes', 'date', 'start_time', 'end_time',
        'price', 'status', 'updated_by', 'reminder_at', 'reminder_sent_at',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'price' => 'decimal:2',
            'status' => AppointmentStatus::class,
            'reminder_at' => 'datetime',
            'reminder_sent_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Appointment $appointment): void {
            if (! $appointment->exists || $appointment->isDirty(['business_id', 'date', 'start_time'])) {
                $business = $appointment->relationLoaded('business')
                    ? $appointment->business
                    : Business::query()->find($appointment->business_id);

                if ($business && $appointment->date && $appointment->start_time) {
                    $appointment->reminder_at = AppointmentReminder::at($appointment, $business);
                }

                if ($appointment->exists) {
                    $appointment->reminder_sent_at = null;
                }
            }
        });
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    /**
     * Live service name when the row is still linked, otherwise the snapshot stored when the service was removed.
     */
    public function resolvedServiceName(): ?string
    {
        $name = $this->service?->name ?? $this->service_name;

        return $name !== null && $name !== '' ? $name : null;
    }

    /**
     * Live employee name when the row is still linked, otherwise the snapshot stored when the employee was removed.
     */
    public function resolvedEmployeeName(): ?string
    {
        $name = $this->employee?->name ?? $this->employee_name;

        return $name !== null && $name !== '' ? $name : null;
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
