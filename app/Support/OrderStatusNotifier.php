<?php

namespace App\Support;

use App\Mail\OrderStatusUpdate;
use App\Models\Order;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class OrderStatusNotifier
{
    /**
     * Email the customer when their order reaches a milestone. Runs after the
     * response so an admin changing a status never waits on the mail provider,
     * and a mail failure never breaks the status change.
     */
    public static function notify(Order $order): void
    {
        if (! $order->status->notifiesCustomer() || blank($order->customer_email)) {
            return;
        }

        $status = $order->status;

        defer(function () use ($order, $status): void {
            try {
                Mail::to($order->customer_email, $order->customer_name)
                    ->send(new OrderStatusUpdate($order, $status));
            } catch (Throwable $exception) {
                Log::error("Could not send status email for {$order->order_number}", [
                    'order_id' => $order->id,
                    'status' => $status->value,
                    'error' => $exception->getMessage(),
                ]);
                report($exception);
            }
        });
    }
}
