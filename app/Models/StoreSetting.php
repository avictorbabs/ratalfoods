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
        'welcome_offer_enabled',
        'welcome_discount_percent',
        'welcome_max_discount',
        'welcome_min_order',
        'welcome_valid_days',
        'welcome_delay_seconds',
        'welcome_headline',
        'welcome_body',
        'loyalty_enabled',
        'loyalty_points_per_dollar',
        'loyalty_point_value',
        'loyalty_min_redeem',
        'loyalty_max_percent',
        'loyalty_expiry_months',
        'winback_enabled',
        'winback_days_inactive',
        'winback_discount_percent',
        'winback_valid_days',
    ];

    protected function casts(): array
    {
        return [
            'is_open' => 'boolean',
            'tax_rate' => 'decimal:2',
            'welcome_offer_enabled' => 'boolean',
            'welcome_discount_percent' => 'decimal:2',
            'welcome_max_discount' => 'decimal:2',
            'welcome_min_order' => 'decimal:2',
            'loyalty_enabled' => 'boolean',
            'loyalty_points_per_dollar' => 'decimal:2',
            'loyalty_point_value' => 'decimal:4',
            'loyalty_min_redeem' => 'integer',
            'loyalty_max_percent' => 'integer',
            'loyalty_expiry_months' => 'integer',
            'winback_enabled' => 'boolean',
            'winback_days_inactive' => 'integer',
            'winback_discount_percent' => 'decimal:2',
            'winback_valid_days' => 'integer',
        ];
    }

    public static function current(): self
    {
        $settings = static::query()->firstOrCreate([], [
            'store_name' => 'Ratal Foods',
            'phone' => '226-348-7156',
            'email' => 'info@ratalfoods.ca',
            'address' => 'Windsor, ON',
            'is_open' => true,
            'opening_hours' => 'Mon–Sat: 11am – 9pm',
            'tax_rate' => 13,
            'pickup_message' => 'Ready in 2 Hours',
        ]);

        // Pick up column defaults (e.g. the welcome offer) that were not part of the insert.
        return $settings->wasRecentlyCreated ? $settings->refresh() : $settings;
    }
}
