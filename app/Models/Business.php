<?php

namespace App\Models;

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
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'allow_employee_service_edit' => 'boolean',
        ];
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
}
