<?php

namespace App\Actions;

use App\Mail\NewOrderReceived;
use App\Mail\OrderConfirmation;
use App\Models\Order;
use App\Models\StoreSetting;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendOrderNotifications
{
    /**
     * Send the customer invoice and the store notification after the
     * response has gone out, so checkout never waits on the mail
     * provider. Safe to call more than once: only the first call for an
     * order sends anything.
     */
    public function handle(Order $order): void
    {
        if (! $order->claimNotification()) {
            return;
        }

        defer(function () use ($order): void {
            try {
                Mail::to($order->customer_email, $order->customer_name)
                    ->send(new OrderConfirmation($order));

                Mail::to(self::storeRecipients())
                    ->send(new NewOrderReceived($order));
            } catch (Throwable $exception) {
                // Release the claim so a later retry (e.g. re-hitting the
                // Stripe webhook) can send it instead of staying silent.
                $order->forceFill(['notified_at' => null])->save();

                Log::error("Could not send order emails for {$order->order_number}", [
                    'order_id' => $order->id,
                    'error' => $exception->getMessage(),
                ]);
                report($exception);
            }
        }, "order-emails-{$order->id}");
    }

    /**
     * @return list<string>
     */
    public static function storeRecipients(): array
    {
        $recipients = config('mail.order_notifications', []);

        if ($recipients === []) {
            $recipients = array_filter([StoreSetting::current()->email]);
        }

        return array_values($recipients);
    }
}
