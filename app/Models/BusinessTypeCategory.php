<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BusinessTypeCategory extends Model
{
    protected $fillable = ['name', 'sort_order'];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    public function businessTypes(): HasMany
    {
        return $this->hasMany(BusinessType::class)->orderBy('sort_order');
    }
}
