<?php

namespace App\Support;

use App\Models\Product;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Throwable;

class PickupLeadTime
{
    public static function timezone(): string
    {
        return (string) config('marketing.store_timezone', 'America/Toronto');
    }

    /** Hours the kitchen needs before an order can be collected (editable on the Menu page). */
    public static function hours(): int
    {
        return max(0, (int) PickupInfo::resolve()['lead_hours']);
    }

    /**
     * Hours needed for a basket. Items marked "Available for pickup" are ready to
     * collect straight away, so the lead time only applies when the basket holds
     * at least one item that is not.
     *
     * @param  Collection<int, Product>  $products
     */
    public static function hoursFor(Collection $products): int
    {
        return $products->isNotEmpty() && $products->every(fn ($product) => (bool) $product->available_for_pickup)
            ? 0
            : self::hours();
    }

    /** The earliest moment a pickup can be, in the store's own time zone. */
    public static function earliest(?int $hours = null): CarbonImmutable
    {
        return CarbonImmutable::now(self::timezone())->addHours($hours ?? self::hours());
    }

    /**
     * Whether a chosen pickup date and slot (like "4:00 PM") is far enough ahead.
     */
    public static function allows(string $date, string $slot, ?int $hours = null): bool
    {
        try {
            $when = CarbonImmutable::createFromFormat('Y-m-d g:i A', substr($date, 0, 10).' '.trim($slot), self::timezone());
        } catch (Throwable) {
            return false;
        }

        // A malformed slot comes back as false: treat as not allowed.
        return $when !== false && $when->gte(self::earliest($hours)->startOfMinute());
    }

    /**
     * What the checkout form needs to limit the date and time choices.
     *
     * @return array{date: string, minutes: int, hours: int}
     */
    public static function window(?int $hours = null): array
    {
        $hours ??= self::hours();
        $earliest = self::earliest($hours);

        return [
            'date' => $earliest->format('Y-m-d'),
            'minutes' => (int) $earliest->format('G') * 60 + (int) $earliest->format('i'),
            'hours' => $hours,
        ];
    }
}
