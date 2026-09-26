<?php

namespace App\Models;

use App\Support\CouponException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Coupon extends Model
{
    public const TYPE_PERCENT = 'percent';

    public const TYPE_FIXED = 'fixed';

    protected $fillable = [
        'code', 'type', 'value', 'min_order', 'max_discount', 'starts_at', 'expires_at',
        'usage_limit', 'first_order_only', 'email', 'is_welcome', 'is_active', 'campaign',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'min_order' => 'decimal:2',
            'max_discount' => 'decimal:2',
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
            'first_order_only' => 'boolean',
            'is_welcome' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public static function normalize(string $code): string
    {
        return strtoupper(trim($code));
    }

    public function timesUsed(): int
    {
        return $this->orders()->countingPurchases()->count();
    }

    public function description(): string
    {
        return $this->type === self::TYPE_PERCENT
            ? rtrim(rtrim(number_format((float) $this->value, 2), '0'), '.').'% off'
            : '$'.number_format((float) $this->value, 2).' off';
    }

    public function discountFor(float $subtotal): float
    {
        $discount = $this->type === self::TYPE_PERCENT
            ? $subtotal * ((float) $this->value / 100)
            : (float) $this->value;

        if ($this->max_discount !== null) {
            $discount = min($discount, (float) $this->max_discount);
        }

        return round(min($discount, $subtotal), 2);
    }

    /**
     * Find a coupon and make sure it can be used for this order.
     *
     * @throws CouponException
     */
    public static function resolveForOrder(string $code, float $subtotal, string $email, ?int $userId, bool $lock = false): self
    {
        $query = static::query()->where('code', static::normalize($code));

        if ($lock) {
            $query->lockForUpdate();
        }

        $coupon = $query->first();

        if (! $coupon || ! $coupon->is_active) {
            throw new CouponException('That coupon code is not valid.');
        }

        if ($coupon->starts_at && $coupon->starts_at->isFuture()) {
            throw new CouponException('That coupon is not active yet.');
        }

        if ($coupon->expires_at && $coupon->expires_at->isPast()) {
            throw new CouponException('That coupon has expired.');
        }

        if ($coupon->email && strcasecmp($coupon->email, trim($email)) !== 0) {
            throw new CouponException('This coupon belongs to a different email address.');
        }

        if ($coupon->min_order !== null && $subtotal < (float) $coupon->min_order) {
            throw new CouponException('This coupon needs a minimum order of $'.number_format((float) $coupon->min_order, 2).'.');
        }

        if ($coupon->usage_limit !== null && $coupon->timesUsed() >= $coupon->usage_limit) {
            throw new CouponException('That coupon has already been used.');
        }

        if ($coupon->first_order_only && static::hasPreviousOrder($email, $userId)) {
            throw new CouponException('This coupon is only valid on your first order.');
        }

        return $coupon;
    }

    public static function hasPreviousOrder(string $email, ?int $userId): bool
    {
        return Order::query()
            ->countingPurchases()
            ->where(function ($inner) use ($email, $userId): void {
                $inner->whereRaw('lower(customer_email) = ?', [strtolower(trim($email))]);

                if ($userId) {
                    $inner->orWhere('user_id', $userId);
                }
            })
            ->exists();
    }

    public static function issueWelcome(NewsletterSubscriber $subscriber, StoreSetting $settings): self
    {
        $existing = static::query()
            ->where('is_welcome', true)
            ->where('email', $subscriber->email)
            ->first();

        if ($existing) {
            return $existing;
        }

        return static::query()->create([
            'code' => static::generateCode('WELCOME'),
            'type' => self::TYPE_PERCENT,
            'value' => $settings->welcome_discount_percent,
            'max_discount' => $settings->welcome_max_discount,
            'min_order' => $settings->welcome_min_order,
            'expires_at' => now()->addDays((int) $settings->welcome_valid_days)->endOfDay(),
            'usage_limit' => 1,
            'first_order_only' => true,
            'email' => $subscriber->email,
            'is_welcome' => true,
            'campaign' => 'welcome',
            'is_active' => true,
        ]);
    }

    /**
     * A small personal code for a customer we have not heard from in a while.
     */
    public static function issueWinback(string $email, StoreSetting $settings): self
    {
        return static::query()->create([
            'code' => static::generateCode('MISSYOU'),
            'type' => self::TYPE_PERCENT,
            'value' => $settings->winback_discount_percent,
            'expires_at' => now()->addDays((int) $settings->winback_valid_days)->endOfDay(),
            'usage_limit' => 1,
            'first_order_only' => false,
            'email' => strtolower(trim($email)),
            'is_welcome' => false,
            'campaign' => 'winback',
            'is_active' => true,
        ]);
    }

    public static function generateCode(string $prefix): string
    {
        do {
            $code = $prefix.'-'.strtoupper(Str::random(6));
        } while (static::query()->where('code', $code)->exists());

        return $code;
    }
}
