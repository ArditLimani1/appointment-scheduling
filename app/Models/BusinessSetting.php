<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BusinessSetting extends Model
{
    protected $fillable = [
        'business_name', 'slug', 'slot_duration', 'min_booking_notice',
        'max_booking_window', 'timezone', 'currency', 'currency_symbol',
    ];
}
