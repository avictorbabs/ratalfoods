<?php

namespace App\Listeners;

use App\Enums\OrderStatus;
use App\Models\Booking;
use App\Models\Order;
use App\Models\User;
use App\Support\Loyalty;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Verified;
use Throwable;

/**
 * Attach orders and bookings made as a guest to the account that owns the same
 * (verified) email address. Only verified accounts are linked, so nobody can
 * read someone else's history by registering with their address.
 */
class LinkGuestRecords
{
    public function handle(Verified|Login $event): void
    {
        $user = $event->user;

        if (! $user instanceof User || ! $user->hasVerifiedEmail()) {
            return;
        }

        $email = strtolower(trim($user->email));

        Order::query()->whereNull('user_id')->whereRaw('lower(customer_email) = ?', [$email])->update(['user_id' => $user->id]);
        Booking::query()->whereNull('user_id')->whereRaw('lower(customer_email) = ?', [$email])->update(['user_id' => $user->id]);

        // Finished orders that were placed as a guest now earn their points too.
        try {
            Order::query()
                ->where('user_id', $user->id)
                ->whereNull('loyalty_points_earned')
                ->whereIn('status', [OrderStatus::Completed->value, OrderStatus::Delivered->value])
                ->each(fn (Order $order) => Loyalty::awardFor($order));
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
