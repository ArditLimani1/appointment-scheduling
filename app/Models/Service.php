<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    protected $fillable = [
        'business_id', 'name', 'description', 'duration', 'price', 'icon', 'is_active', 'is_popular', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'is_active' => 'boolean',
            'is_popular' => 'boolean',
        ];
    }

    public function employees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'employee_service');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }
}
