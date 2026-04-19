<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BusinessTypeCategory extends Model
{
    protected $fillable = ['name', 'name_sq', 'sort_order'];

    public function localizedLabel(): string
    {
        if (app()->getLocale() === 'sq' && filled($this->name_sq)) {
            return $this->name_sq;
        }

        return $this->name;
    }

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
