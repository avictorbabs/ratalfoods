<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Mail\StripeOrderAlert;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class StripeWebhookEventsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
        config([
            'services.stripe.webhook_secret' => 'whsec_test',
            'mail.order_notifications' => ['owner@example.com'],
        ]);
    }

    private function order(array $overrides = []): Order
    {
        return Order::query()->create([
            'customer_name' => 'Ada',
            'customer_email' => 'ada@example.com',
            'customer_phone' => '555-0100',
            'subtotal' => 20, 'tax' => 2.6, 'delivery_fee' => 0, 'total' => 22.6,
            'collection_method' => 'pickup',
            'status' => OrderStatus::Pending,
            'payment_status' => PaymentStatus::Unpaid,
            'payment_method' => 'stripe',
            'stripe_session_id' => 'cs_test_1',
            ...$overrides,
        ]);
    }

    private function paidOrder(): Order
    {
        return $this->order([
            'status' => OrderStatus::PaymentConfirmed,
            'payment_status' => PaymentStatus::Paid,
            'stripe_payment_intent_id' => 'pi_123',
        ]);
    }

    private function send(string $type, array $object): TestResponse
    {
        $payload = json_encode(['id' => 'evt_1', 'object' => 'event', 'type' => $type, 'data' => ['object' => $object]]);
        $timestamp = time();
        $signature = hash_hmac('sha256', "{$timestamp}.{$payload}", 'whsec_test');

        return $this->call('POST', '/stripe/webhook', [], [], [], [
            'HTTP_STRIPE_SIGNATURE' => "t={$timestamp},v1={$signature}",
            'CONTENT_TYPE' => 'application/json',
        ], $payload);
    }

    private function sessionPayload(Order $order): array
    {
        return [
            'id' => $order->stripe_session_id,
            'object' => 'checkout.session',
            'payment_status' => 'unpaid',
            'metadata' => ['order_id' => (string) $order->id],
        ];
    }

    public function test_an_expired_checkout_cancels_the_unpaid_order()
    {
        $order = $this->order();

        $this->send('checkout.session.expired', $this->sessionPayload($order))->assertOk();

        $this->assertSame(OrderStatus::Cancelled, $order->fresh()->status);
    }

    public function test_a_failed_delayed_payment_cancels_the_order()
    {
        $order = $this->order();

        $this->send('checkout.session.async_payment_failed', $this->sessionPayload($order))->assertOk();

        $this->assertSame(OrderStatus::Cancelled, $order->fresh()->status);
    }

    public function test_an_expired_event_never_cancels_a_paid_order()
    {
        $order = $this->paidOrder();

        $this->send('checkout.session.expired', $this->sessionPayload($order))->assertOk();

        $this->assertSame(OrderStatus::PaymentConfirmed, $order->fresh()->status);
    }

    public function test_a_full_refund_marks_the_order_refunded_and_alerts_the_store()
    {
        $order = $this->paidOrder();

        $this->send('charge.refunded', [
            'id' => 'ch_1', 'object' => 'charge', 'payment_intent' => 'pi_123',
            'refunded' => true, 'amount_refunded' => 2260, 'currency' => 'cad',
        ])->assertOk();

        $order->refresh();
        $this->assertSame(OrderStatus::Refunded, $order->status);
        $this->assertSame(PaymentStatus::Refunded, $order->payment_status);
        Mail::assertSent(StripeOrderAlert::class, fn ($mail) => $mail->kind === 'refund' && $mail->hasTo('owner@example.com'));
    }

    public function test_a_partial_refund_only_alerts_the_store()
    {
        $order = $this->paidOrder();

        $this->send('charge.refunded', [
            'id' => 'ch_1', 'object' => 'charge', 'payment_intent' => 'pi_123',
            'refunded' => false, 'amount_refunded' => 500, 'currency' => 'cad',
        ])->assertOk();

        $this->assertSame(PaymentStatus::Paid, $order->fresh()->payment_status);
        Mail::assertSent(StripeOrderAlert::class, 1);
    }

    public function test_a_repeated_full_refund_event_alerts_only_once()
    {
        $this->paidOrder();
        $charge = [
            'id' => 'ch_1', 'object' => 'charge', 'payment_intent' => 'pi_123',
            'refunded' => true, 'amount_refunded' => 2260, 'currency' => 'cad',
        ];

        $this->send('charge.refunded', $charge)->assertOk();
        $this->send('charge.refunded', $charge)->assertOk();

        Mail::assertSent(StripeOrderAlert::class, 1);
    }

    public function test_a_dispute_alerts_the_store_and_flags_the_order()
    {
        $order = $this->paidOrder();

        $this->send('charge.dispute.created', [
            'id' => 'dp_1', 'object' => 'dispute', 'payment_intent' => 'pi_123',
            'amount' => 2260, 'currency' => 'cad', 'reason' => 'fraudulent',
        ])->assertOk();

        $this->assertSame(OrderStatus::Disputed, $order->fresh()->status);
        $this->assertSame(PaymentStatus::Paid, $order->fresh()->payment_status);
        Mail::assertSent(StripeOrderAlert::class, fn ($mail) => $mail->kind === 'dispute'
            && str_contains($mail->render(), 'fraudulent'));
    }

    public function test_events_for_unknown_orders_are_ignored_safely()
    {
        $this->send('charge.refunded', [
            'id' => 'ch_x', 'object' => 'charge', 'payment_intent' => 'pi_unknown',
            'refunded' => true, 'amount_refunded' => 100, 'currency' => 'cad',
        ])->assertOk();

        Mail::assertNothingSent();
    }
}
