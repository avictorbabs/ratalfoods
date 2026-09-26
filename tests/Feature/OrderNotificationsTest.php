<?php

namespace Tests\Feature;

use App\Enums\PaymentStatus;
use App\Mail\NewOrderReceived;
use App\Mail\OrderConfirmation;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class OrderNotificationsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
        config([
            'mail.order_notifications' => ['owner@example.com', 'kitchen@example.com'],
            'services.stripe.webhook_secret' => 'whsec_test',
        ]);
    }

    public function test_pickup_order_queues_customer_and_store_emails()
    {
        $this->post('/orders', $this->orderPayload())->assertRedirect(route('checkout'));

        $order = Order::query()->sole();

        $this->assertNotNull($order->notified_at);
        Mail::assertSent(OrderConfirmation::class, fn ($mail) => $mail->hasTo('customer@example.com'));
        Mail::assertSent(NewOrderReceived::class, fn ($mail) => $mail->hasTo('owner@example.com')
            && $mail->hasTo('kitchen@example.com')
            && $mail->hasReplyTo('customer@example.com'));
    }

    public function test_store_email_falls_back_to_store_settings()
    {
        config(['mail.order_notifications' => []]);

        $this->post('/orders', $this->orderPayload());

        Mail::assertSent(NewOrderReceived::class, fn ($mail) => $mail->hasTo('info@ratalfoods.ca'));
    }

    public function test_emails_render_as_html()
    {
        $this->post('/orders', $this->orderPayload(['notes' => 'Extra pepper']));
        $order = Order::query()->sole();

        $customer = (new OrderConfirmation($order))->render();
        $store = (new NewOrderReceived($order))->render();

        foreach (['Amala and Abula', $order->order_number, 'Store Pickup', '<table'] as $needle) {
            $this->assertStringContainsString($needle, $customer);
        }
        foreach (['Test Customer', 'Extra pepper', '555-0100'] as $needle) {
            $this->assertStringContainsString($needle, $store);
        }
    }

    public function test_placing_an_order_without_a_phone_number_fails_validation()
    {
        $payload = $this->orderPayload();
        unset($payload['customer_phone']);

        $response = $this->post('/orders', $payload);

        $response->assertSessionHasErrors('customer_phone');
    }

    public function test_stripe_webhook_sends_paid_order_emails_exactly_once()
    {
        $order = $this->stripeOrder('cs_test_123');

        $this->stripeWebhook($this->checkoutCompletedEvent($order))->assertOk();
        $this->stripeWebhook($this->checkoutCompletedEvent($order))->assertOk();

        $this->assertSame(PaymentStatus::Paid, $order->fresh()->payment_status);
        Mail::assertSent(OrderConfirmation::class, 1);
        Mail::assertSent(NewOrderReceived::class, 1);
    }

    public function test_unpaid_stripe_session_sends_nothing()
    {
        $order = $this->stripeOrder('cs_test_456');

        $this->stripeWebhook($this->checkoutCompletedEvent($order, 'unpaid'))->assertOk();

        $this->assertSame(PaymentStatus::Unpaid, $order->fresh()->payment_status);
        Mail::assertNothingSent();
    }

    public function test_webhook_rejects_bad_signature()
    {
        $this->stripeWebhook(['type' => 'checkout.session.completed'], 'whsec_wrong')->assertStatus(400);
    }

    private function orderPayload(array $overrides = []): array
    {
        $product = Product::query()->forceCreate([
            'name' => 'Amala and Abula',
            'price' => 26.99,
            'category' => 'Mains',
            'is_active' => true,
        ]);

        return [
            'customer_name' => 'Test Customer',
            'customer_email' => 'customer@example.com',
            'customer_phone' => '555-0100',
            'collection_method' => 'pickup',
            'pickup_date' => now()->addDay()->toDateString(),
            'pickup_time' => '4:00 PM',
            'payment_method' => 'cash_on_delivery',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
            ...$overrides,
        ];
    }

    private function stripeOrder(string $sessionId): Order
    {
        $this->post('/orders', $this->orderPayload());

        $order = Order::query()->sole();
        $order->update(['payment_method' => 'stripe', 'stripe_session_id' => $sessionId, 'notified_at' => null]);
        Mail::fake();

        return $order;
    }

    private function checkoutCompletedEvent(Order $order, string $paymentStatus = 'paid'): array
    {
        return [
            'id' => 'evt_test',
            'object' => 'event',
            'type' => 'checkout.session.completed',
            'data' => ['object' => [
                'id' => $order->stripe_session_id,
                'object' => 'checkout.session',
                'payment_status' => $paymentStatus,
                'metadata' => ['order_id' => (string) $order->id],
            ]],
        ];
    }

    private function stripeWebhook(array $event, string $secret = 'whsec_test'): TestResponse
    {
        $payload = json_encode($event);
        $timestamp = time();
        $signature = hash_hmac('sha256', "{$timestamp}.{$payload}", $secret);

        return $this->call('POST', '/stripe/webhook', [], [], [], [
            'HTTP_STRIPE_SIGNATURE' => "t={$timestamp},v1={$signature}",
            'CONTENT_TYPE' => 'application/json',
        ], $payload);
    }
}
