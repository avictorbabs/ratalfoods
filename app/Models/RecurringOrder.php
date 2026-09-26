<?php

namespace App\Models;

use App\Enums\CollectionMethod;
use App\Enums\OrderStatus;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RecurringOrder extends Model
{
    public const ACTIVE = 'active';

    public const PAUSED = 'paused';

    public const CANCELLED = 'cancelled';

    public const ENDED = 'ended';

    public const WEEKLY = 'weekly';

    public const BIWEEKLY = 'biweekly';

    protected $fillable = [
        'user_id', 'status', 'frequency', 'collection_method', 'customer_name', 'customer_email', 'customer_phone',
        'pickup_slot', 'delivery_slot', 'delivery_address', 'notes', 'items', 'next_service_date', 'ends_on', 'skipped_dates',
    ];

    protected function casts(): array
    {
        return [
            'items' => 'array',
            'skipped_dates' => 'array',
            'collection_method' => CollectionMethod::class,
            'next_service_date' => 'date',
            'ends_on' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function intervalDays(): int
    {
        return $this->frequency === self::BIWEEKLY ? 14 : 7;
    }

    public function frequencyLabel(): string
    {
        return $this->frequency === self::BIWEEKLY ? 'Every 2 weeks' : 'Every week';
    }

    public function isSkipped(string $date): bool
    {
        return in_array($date, $this->skipped_dates ?? [], true);
    }

    /**
     * The soonest service date the customer could still skip: an order we already
     * created that has not been started, otherwise the next date on the schedule.
     */
    public function upcomingDate(): ?CarbonImmutable
    {
        if ($this->status !== self::ACTIVE) {
            return null;
        }

        $order = $this->orders()
            ->whereDate('recurring_for', '>=', today())
            ->where('status', OrderStatus::Pending->value)
            ->orderBy('recurring_for')
            ->first();

        if ($order) {
            return CarbonImmutable::parse($order->recurring_for);
        }

        $next = CarbonImmutable::parse($this->next_service_date);

        // Dates already in the past can no longer be skipped or served.
        while ($next->lt(today()) || $this->isSkipped($next->toDateString())) {
            $next = $next->addDays($this->intervalDays());
        }

        if ($this->ends_on && $next->gt($this->ends_on)) {
            return null;
        }

        return $next;
    }
}
