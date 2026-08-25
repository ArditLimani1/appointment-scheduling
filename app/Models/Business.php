<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Support\ClientIdentification;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Business extends Model
{
    protected $fillable = [
        'owner_id', 'business_type_id', 'name', 'slug', 'location', 'phone', 'email',
        'description', 'logo', 'timezone', 'currency', 'currency_symbol',
        'slot_duration', 'min_booking_notice', 'max_booking_window',
        'is_active', 'client_identifier_type', 'allow_employee_service_edit',
        'uses_shared_resources', 'auto_confirm_appointments', 'single_employee_mode',
        'reminders_enabled', 'reminder_time',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'allow_employee_service_edit' => 'boolean',
            'uses_shared_resources' => 'boolean',
            'auto_confirm_appointments' => 'boolean',
            'single_employee_mode' => 'boolean',
            'reminders_enabled' => 'boolean',
        ];
    }

    /**
     * Normalise the stored time (e.g. "08:00:00") to "H:i" for forms and comparisons.
     */
    protected function reminderTime(): Attribute
    {
        return Attribute::get(
            static fn (?string $value): string => $value ? substr($value, 0, 5) : '08:00',
        );
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function businessType(): BelongsTo
    {
        return $this->belongsTo(BusinessType::class);
    }

    public function employees(): HasMany
    {
        return $this->hasMany(User::class, 'business_id');
    }

    /**
     * Hired team members (not the owner-as-staff account).
     */
    public function hiredEmployees(): HasMany
    {
        return $this->employees()->where('role', UserRole::Employee);
    }

    public function hasHiredEmployees(): bool
    {
        return $this->hiredEmployees()->exists();
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function businessRoles(): HasMany
    {
        return $this->hasMany(BusinessRole::class);
    }

    public function sharedResources(): HasMany
    {
        return $this->hasMany(SharedResource::class);
    }

    protected function clientIdentifierType(): Attribute
    {
        return Attribute::get(
            static fn (?string $value) => ClientIdentification::resolve($value),
        );
    }
}
