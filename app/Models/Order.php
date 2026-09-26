<?php

namespace App\Models;

use App\Enums\CollectionMethod;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Support\Loyalty;
use App\Support\OrderStatusNotifier;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Order extends Model
{
    protected $fillable = [
        'order_number',
        'user_id',
        'coupon_id',
        'coupon_code',
        'discount',
        'completed_at',
        'review_requested_at',
        'customer_name',
        'customer_email',
        'customer_phone',
        'subtotal',
        'tax',
        'delivery_fee',
        'delivery_zone',
        'total',
        'collection_method',
        'status',
        'payment_status',
        'payment_method',
        'stripe_session_id',
        'stripe_payment_intent_id',
        'pickup_time',
        'delivery_address',
        'delivery_time_preference',
        'notes',
        'notified_at',
        'tracking_token',
        'loyalty_points_redeemed',
        'loyalty_discount',
        'loyalty_points_earned',
        'recurring_order_id',
        'recurring_for',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'tax' => 'decimal:2',
            'delivery_fee' => 'decimal:2',
            'discount' => 'decimal:2',
            'loyalty_discount' => 'decimal:2',
            'recurring_for' => 'date',
            'total' => 'decimal:2',
            'collection_method' => CollectionMethod::class,
            'status' => OrderStatus::class,
            'payment_status' => PaymentStatus::class,
            'notified_at' => 'datetime',
            'completed_at' => 'datetime',
            'review_requested_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Order $order): void {
            if ($order->isDirty('status') && in_array($order->status, [OrderStatus::Completed, OrderStatus::Delivered], true) && $order->completed_at === null) {
                $order->completed_at = now();
            }
        });

        static::creating(function (Order $order): void {
            if (empty($order->order_number)) {
                $order->order_number = 'ORD-'.strtoupper(uniqid());
            }

            if (empty($order->tracking_token)) {
                $order->tracking_token = Str::random(32);
            }
        });

        static::created(function (Order $order): void {
            $order->statusEvents()->create(['status' => $order->status]);
        });

        static::updated(function (Order $order): void {
            if (! $order->wasChanged('status')) {
                return;
            }

            $order->statusEvents()->create(['status' => $order->status]);
            Loyalty::handleStatusChange($order);
            OrderStatusNotifier::notify($order);
        });
    }

    protected $hidden = ['tracking_token'];

    protected $appends = ['tracking_url'];

    public function getTrackingUrlAttribute(): ?string
    {
        return $this->tracking_token ? route('orders.track', $this->tracking_token) : null;
    }

    public function statusEvents(): HasMany
    {
        return $this->hasMany(OrderStatusEvent::class)->oldest('id');
    }

    /**
     * Orders that count as a real purchase: not cancelled or refunded, and not
     * an unpaid Stripe checkout (so abandoning the payment page does not burn a coupon).
     */
    public function scopeCountingPurchases(Builder $query): Builder
    {
        return $query
            ->whereNotIn('status', [OrderStatus::Cancelled->value, OrderStatus::Refunded->value])
            ->where(function ($inner): void {
                $inner->where('payment_method', '!=', 'stripe')
                    ->orWhereNull('payment_method')
                    ->orWhere('payment_status', PaymentStatus::Paid->value);
            });
    }

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function collectionLabel(): string
    {
        return $this->collection_method === CollectionMethod::Pickup
            ? 'Store Pickup — '.($this->pickup_time ?: 'TBD')
            : 'Delivery — '.($this->delivery_time_preference ?: 'Scheduled');
    }

    public function paymentLabel(): string
    {
        return match ($this->payment_method) {
            'stripe' => $this->payment_status === PaymentStatus::Paid ? 'Paid online (Stripe)' : 'Pay online (Stripe)',
            default => $this->collection_method === CollectionMethod::Pickup
                ? 'Cash on delivery / pay at pickup'
                : 'Cash on delivery',
        };
    }

    /**
     * Atomically mark the order as notified. Returns false if another
     * request (e.g. the Stripe webhook) already claimed it.
     */
    public function claimNotification(): bool
    {
        $claimed = static::query()
            ->whereKey($this->getKey())
            ->whereNull('notified_at')
            ->update(['notified_at' => now()]) === 1;

        if ($claimed) {
            $this->refresh();
        }

        return $claimed;
    }
}
