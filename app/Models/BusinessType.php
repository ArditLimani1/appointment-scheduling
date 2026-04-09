<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BusinessType extends Model
{
    protected $fillable = [
        'business_type_category_id',
        'name',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(BusinessTypeCategory::class, 'business_type_category_id');
    }

    public function businesses(): HasMany
    {
        return $this->hasMany(Business::class);
    }
}
