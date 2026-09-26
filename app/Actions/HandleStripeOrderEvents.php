<?php

namespace App\Actions;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Mail\StripeOrderAlert;
use App\Models\Order;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class HandleStripeOrderEvents
{
    /**
     * Checkout expired (abandoned for 24h) or a delayed payment failed:
     * cancel the order if it was never paid.
     */
    public function cancelUnpaid(object $session): void
    {
        $orderId = $session->metadata['order_id'] ?? null;
        $order = $orderId ? Order::query()->find($orderId) : null;

        if (! $order || $order->stripe_session_id !== ($session->id ?? null)) {
            return;
        }

        if ($order->payment_status !== PaymentStatus::Unpaid || $order->status !== OrderStatus::Pending) {
            return;
        }

        $order->update(['status' => OrderStatus::Cancelled]);
    }

    /**
     * A charge was refunded. A full refund marks the order refunded;
     * partial refunds only alert the store. Both email the store.
     */
    public function recordRefund(object $charge): void
    {
        $order = $this->findByPaymentIntent($charge->payment_intent ?? null);

        if (! $order) {
            Log::warning('Stripe refund for an unknown order', ['charge' => $charge->id ?? null]);

            return;
        }

        $fullyRefunded = (bool) ($charge->refunded ?? false);

        if ($fullyRefunded) {
            if ($order->payment_status === PaymentStatus::Refunded) {
                return;
            }

            $order->update([
                'payment_status' => PaymentStatus::Refunded,
                'status' => OrderStatus::Refunded,
            ]);
        }

        $this->alertStore($order, 'refund', [
            'amount' => ((int) ($charge->amount_refunded ?? 0)) / 100,
            'currency' => strtoupper((string) ($charge->currency ?? 'cad')),
            'full' => $fullyRefunded,
        ]);
    }

    /**
     * A customer disputed a payment (chargeback). The store needs to
     * respond in Stripe, so alert them straight away.
     */
    public function recordDispute(object $dispute): void
    {
        $order = $this->findByPaymentIntent($dispute->payment_intent ?? null);

        if (! $order) {
            Log::warning('Stripe dispute for an unknown order', ['dispute' => $dispute->id ?? null]);

            return;
        }

        if ($order->status !== OrderStatus::Refunded) {
            $order->update(['status' => OrderStatus::Disputed]);
        }

        $this->alertStore($order, 'dispute', [
            'amount' => ((int) ($dispute->amount ?? 0)) / 100,
            'currency' => strtoupper((string) ($dispute->currency ?? 'cad')),
            'reason' => (string) ($dispute->reason ?? 'unknown'),
        ]);
    }

    private function findByPaymentIntent(mixed $paymentIntent): ?Order
    {
        if (! is_string($paymentIntent) || $paymentIntent === '') {
            return null;
        }

        return Order::query()->where('stripe_payment_intent_id', $paymentIntent)->first();
    }

    /**
     * @param  array<string, mixed>  $details
     */
    private function alertStore(Order $order, string $kind, array $details): void
    {
        defer(function () use ($order, $kind, $details): void {
            try {
                Mail::to(SendOrderNotifications::storeRecipients())
                    ->send(new StripeOrderAlert($order, $kind, $details));
            } catch (Throwable $exception) {
                Log::error("Could not send Stripe {$kind} alert for {$order->order_number}", [
                    'error' => $exception->getMessage(),
                ]);
                report($exception);
            }
        });
    }
}
