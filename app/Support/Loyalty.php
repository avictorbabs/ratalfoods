<?php

namespace App\Support;

use App\Enums\OrderStatus;
use App\Models\LoyaltyTransaction;
use App\Models\Order;
use App\Models\StoreSetting;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Loyalty points. Every change is a row in loyalty_transactions. Rows that add
 * points carry a "remaining" balance so spending can use the oldest points first
 * and expiry can remove only what is still unspent.
 */
class Loyalty
{
    public static function settings(): StoreSetting
    {
        return StoreSetting::current();
    }

    public static function enabled(): bool
    {
        return (bool) self::settings()->loyalty_enabled;
    }

    public static function balance(User $user): int
    {
        return (int) LoyaltyTransaction::query()->where('user_id', $user->id)->spendable()->sum('remaining');
    }

    /** Dollar value of a number of points. */
    public static function valueOf(int $points): float
    {
        return floor($points * (float) self::settings()->loyalty_point_value * 100) / 100;
    }

    public static function pointsFor(float $amount): int
    {
        return (int) floor(max(0, $amount) * (float) self::settings()->loyalty_points_per_dollar);
    }

    /**
     * How many points this customer can spend on an order worth $base (after any coupon),
     * and what they are worth. Returns zero when the program is off or the balance is too low.
     *
     * @return array{points: int, discount: float}
     */
    public static function redeemable(User $user, float $base): array
    {
        $none = ['points' => 0, 'discount' => 0.0];
        $settings = self::settings();

        if (! $settings->loyalty_enabled || (float) $settings->loyalty_point_value <= 0 || $base <= 0) {
            return $none;
        }

        $capDollars = $base * ((int) $settings->loyalty_max_percent / 100);
        $byCap = (int) floor($capDollars / (float) $settings->loyalty_point_value);
        $points = min(self::balance($user), $byCap);

        if ($points < max(1, (int) $settings->loyalty_min_redeem)) {
            return $none;
        }

        return ['points' => $points, 'discount' => min(self::valueOf($points), $base)];
    }

    /**
     * Spend points on an order (oldest first).
     *
     * @throws LoyaltyException When the balance is not enough (shown to the customer as a form error).
     */
    public static function redeem(User $user, Order $order, int $points): void
    {
        if ($points <= 0) {
            return;
        }

        DB::transaction(function () use ($user, $order, $points): void {
            $lots = self::lockedLots($user);

            if ($lots->sum('remaining') < $points) {
                throw new LoyaltyException('You do not have enough points for that. Please refresh and try again.');
            }

            self::consume($lots, $points);

            LoyaltyTransaction::query()->create([
                'user_id' => $user->id,
                'order_id' => $order->id,
                'type' => LoyaltyTransaction::REDEEM,
                'points' => -$points,
                'note' => "Used on order {$order->order_number}",
            ]);
        });
    }

    /**
     * Give points for a finished order. Safe to call repeatedly: an order is only awarded once.
     */
    public static function awardFor(Order $order): void
    {
        if (! self::enabled() || ! $order->user_id || $order->loyalty_points_earned !== null) {
            return;
        }

        if (! in_array($order->status, [OrderStatus::Completed, OrderStatus::Delivered], true)) {
            return;
        }

        $eligible = (float) $order->subtotal - (float) $order->discount - (float) $order->loyalty_discount;
        $points = self::pointsFor($eligible);

        DB::transaction(function () use ($order, $points): void {
            if ($points > 0) {
                self::credit($order->user, LoyaltyTransaction::EARN, $points, "Order {$order->order_number}", $order);
            }

            $order->forceFill(['loyalty_points_earned' => $points])->saveQuietly();
        });
    }

    /**
     * An order that will not happen (cancelled, refunded): take back what it earned
     * and return what was spent on it.
     */
    public static function reverseFor(Order $order): void
    {
        if (! $order->user_id) {
            return;
        }

        DB::transaction(function () use ($order): void {
            $user = $order->user;

            if (($order->loyalty_points_earned ?? 0) > 0 && ! self::hasTransaction($order, LoyaltyTransaction::REVERSAL)) {
                $lot = LoyaltyTransaction::query()
                    ->where('order_id', $order->id)
                    ->where('type', LoyaltyTransaction::EARN)
                    ->lockForUpdate()
                    ->first();

                if ($lot && $lot->remaining > 0) {
                    $take = $lot->remaining;
                    $lot->update(['remaining' => 0]);

                    LoyaltyTransaction::query()->create([
                        'user_id' => $user->id,
                        'order_id' => $order->id,
                        'type' => LoyaltyTransaction::REVERSAL,
                        'points' => -$take,
                        'note' => "Order {$order->order_number} was {$order->status->value}",
                    ]);
                }
            }

            if ($order->loyalty_points_redeemed > 0 && ! self::hasTransaction($order, LoyaltyTransaction::RESTORE)) {
                self::credit($user, LoyaltyTransaction::RESTORE, $order->loyalty_points_redeemed, "Returned from order {$order->order_number}", $order);
            }
        });
    }

    /**
     * Manual change by an admin. Positive adds points, negative removes them (oldest first).
     */
    public static function adjust(User $user, int $points, string $note): void
    {
        if ($points === 0) {
            return;
        }

        DB::transaction(function () use ($user, $points, $note): void {
            if ($points > 0) {
                self::credit($user, LoyaltyTransaction::ADJUST, $points, $note);

                return;
            }

            $lots = self::lockedLots($user);
            $take = min(-$points, (int) $lots->sum('remaining'));

            if ($take === 0) {
                return;
            }

            self::consume($lots, $take);

            LoyaltyTransaction::query()->create([
                'user_id' => $user->id,
                'type' => LoyaltyTransaction::ADJUST,
                'points' => -$take,
                'note' => $note,
            ]);
        });
    }

    /**
     * Remove points that passed their expiry date. Returns how many points expired.
     */
    public static function expireDue(): int
    {
        $expired = 0;

        LoyaltyTransaction::query()
            ->where('remaining', '>', 0)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->each(function (LoyaltyTransaction $lot) use (&$expired): void {
                LoyaltyTransaction::query()->create([
                    'user_id' => $lot->user_id,
                    'type' => LoyaltyTransaction::EXPIRE,
                    'points' => -$lot->remaining,
                    'note' => 'Points expired',
                ]);

                $expired += $lot->remaining;
                $lot->update(['remaining' => 0]);
            });

        return $expired;
    }

    /**
     * React to an order changing status. Never lets a points problem break the status change.
     */
    public static function handleStatusChange(Order $order): void
    {
        try {
            match ($order->status) {
                OrderStatus::Completed, OrderStatus::Delivered => self::awardFor($order),
                OrderStatus::Cancelled, OrderStatus::Refunded => self::reverseFor($order),
                default => null,
            };
        } catch (Throwable $exception) {
            Log::error("Loyalty update failed for {$order->order_number}", ['error' => $exception->getMessage()]);
            report($exception);
        }
    }

    private static function credit(User $user, string $type, int $points, string $note, ?Order $order = null): LoyaltyTransaction
    {
        $months = self::settings()->loyalty_expiry_months;

        return LoyaltyTransaction::query()->create([
            'user_id' => $user->id,
            'order_id' => $order?->id,
            'type' => $type,
            'points' => $points,
            'remaining' => $points,
            'expires_at' => $months ? now()->addMonths($months) : null,
            'note' => $note,
        ]);
    }

    /**
     * @return Collection<int, LoyaltyTransaction>
     */
    private static function lockedLots(User $user)
    {
        return LoyaltyTransaction::query()
            ->where('user_id', $user->id)
            ->spendable()
            ->orderByRaw('expires_at is null')
            ->orderBy('expires_at')
            ->orderBy('id')
            ->lockForUpdate()
            ->get();
    }

    /**
     * @param  Collection<int, LoyaltyTransaction>  $lots
     */
    private static function consume($lots, int $points): void
    {
        foreach ($lots as $lot) {
            if ($points <= 0) {
                break;
            }

            $used = min($lot->remaining, $points);
            $lot->update(['remaining' => $lot->remaining - $used]);
            $points -= $used;
        }
    }

    private static function hasTransaction(Order $order, string $type): bool
    {
        return LoyaltyTransaction::query()->where('order_id', $order->id)->where('type', $type)->exists();
    }
}
