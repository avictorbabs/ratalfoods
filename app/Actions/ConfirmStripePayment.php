<?php

namespace App\Actions;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use Stripe\Checkout\Session as StripeSession;

class ConfirmStripePayment
{
    public function __construct(private SendOrderNotifications $notifications) {}

    /**
     * Mark the order paid if the Checkout Session is paid, then send the
     * order emails. Used by both the success redirect and the webhook.
     */
    public function handle(StripeSession $session): ?Order
    {
        $orderId = $session->metadata['order_id'] ?? null;
        $order = $orderId ? Order::query()->with('items')->find($orderId) : null;

        if (! $order || $order->stripe_session_id !== $session->id) {
            return null;
        }

        if ($session->payment_status === 'paid' && $order->payment_status !== PaymentStatus::Paid) {
            $order->update([
                'payment_status' => PaymentStatus::Paid,
                'status' => OrderStatus::PaymentConfirmed,
                'stripe_payment_intent_id' => is_string($session->payment_intent ?? null) ? $session->payment_intent : null,
            ]);
        }

        if ($order->payment_status === PaymentStatus::Paid) {
            $this->notifications->handle($order);
        }

        return $order;
    }
}
