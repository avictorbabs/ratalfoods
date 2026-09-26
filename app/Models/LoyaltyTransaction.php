<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoyaltyTransaction extends Model
{
    public const EARN = 'earn';

    public const REDEEM = 'redeem';

    public const REVERSAL = 'reversal';

    public const RESTORE = 'restore';

    public const ADJUST = 'adjust';

    public const EXPIRE = 'expire';

    protected $fillable = ['user_id', 'order_id', 'type', 'points', 'remaining', 'expires_at', 'note'];

    protected function casts(): array
    {
        return [
            'points' => 'integer',
            'remaining' => 'integer',
            'expires_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Point-adding rows that still have unspent points and have not expired.
     */
    public function scopeSpendable(Builder $query): Builder
    {
        return $query
            ->where('remaining', '>', 0)
            ->where(function ($inner): void {
                $inner->whereNull('expires_at')->orWhere('expires_at', '>', now());
            });
    }

    public function label(): string
    {
        return match ($this->type) {
            self::EARN => 'Points earned',
            self::REDEEM => 'Points used',
            self::REVERSAL => 'Points removed',
            self::RESTORE => 'Points returned',
            self::ADJUST => 'Adjustment',
            self::EXPIRE => 'Points expired',
            default => ucfirst($this->type),
        };
    }
}
