<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StoreSetting extends Model
{
    protected $fillable = [
        'store_name',
        'phone',
        'email',
        'address',
        'is_open',
        'opening_hours',
        'tax_rate',
        'pickup_message',
    ];

    protected function casts(): array
    {
        return [
            'is_open' => 'boolean',
            'tax_rate' => 'decimal:2',
        ];
    }

    public static function current(): self
    {
        return static::query()->firstOrCreate([], [
            'store_name' => 'Ratal Foods',
            'phone' => '226-348-7156',
            'email' => 'info@ratalfoods.ca',
            'address' => 'Windsor, ON',
            'is_open' => true,
            'opening_hours' => 'Mon–Sat: 11am – 9pm',
            'tax_rate' => 13,
            'pickup_message' => 'Ready in 2 Hours',
        ]);
    }
}
