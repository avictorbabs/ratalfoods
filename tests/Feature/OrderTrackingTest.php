<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Mail\OrderStatusUpdate;
use App\Models\DeliveryFee;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Defer\DeferredCallbackCollection;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class OrderTrackingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
        config(['mail.order_notifications' => ['owner@example.com']]);
    }

    private function placeOrder(string $method = 'pickup'): Order
    {
        $product = Product::query()->firstOrCreate(['name' => 'Jollof'], ['price' => 20, 'category' => 'Mains', 'is_active' => true]);

        $payload = [
            'customer_name' => 'Tola Track', 'customer_email' => 'tola@example.com', 'customer_phone' => '555-0100',
            'collection_method' => $method, 'payment_method' => 'cash_on_delivery',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ];

        if ($method === 'pickup') {
            $payload += ['pickup_date' => now()->addDay()->toDateString(), 'pickup_time' => '4:00 PM'];
        } else {
            $payload += ['delivery_address' => '1 Main St Windsor', 'delivery_date' => now()->addDay()->toDateString(), 'delivery_time' => '16:00'];
            DeliveryFee::query()->create(['name' => 'Windsor', 'match_terms' => 'Windsor', 'fee' => 5, 'is_active' => true]);
        }

        $this->post('/orders', $payload)->assertSessionHasNoErrors();

        return Order::query()->latest('id')->firstOrFail();
    }

    /** Status emails are deferred until after the response; run them now for direct model updates. */
    private function flushDeferred(): void
    {
        app(DeferredCallbackCollection::class)->invoke();
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => UserRole::Admin]);
    }

    public function test_every_order_gets_a_tracking_link_and_a_first_status_event(): void
    {
        $order = $this->placeOrder();

        $this->assertNotEmpty($order->tracking_token);
        $this->assertStringContainsString($order->tracking_token, $order->tracking_url);
        $this->assertSame(['pending'], $order->statusEvents->map(fn ($e) => $e->status->value)->all());
        $this->assertArrayNotHasKey('tracking_token', $order->toArray());
    }

    public function test_guests_can_follow_an_order_with_its_link(): void
    {
        $order = $this->placeOrder();

        $this->get($order->tracking_url)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('public/OrderTracking')
                ->where('order.order_number', $order->order_number)
                ->where('timeline.steps.0.state', 'current')
                ->where('timeline.steps.1.state', 'upcoming')
                ->where('timeline.steps.2.label', 'Ready for pickup'));
    }

    public function test_delivery_orders_use_delivery_wording(): void
    {
        $order = $this->placeOrder('delivery_request');
        $order->update(['status' => OrderStatus::OutForDelivery]);

        $this->get($order->tracking_url)->assertInertia(fn ($page) => $page
            ->where('timeline.steps.2.label', 'Out for delivery')
            ->where('timeline.steps.2.state', 'current')
            ->where('timeline.steps.3.label', 'Delivered')
            ->where('timeline.steps.0.state', 'done'));
    }

    public function test_the_timeline_advances_and_records_when_each_step_happened(): void
    {
        $order = $this->placeOrder();

        $order->update(['status' => OrderStatus::Processing]);
        $order->update(['status' => OrderStatus::Ready]);
        $order->update(['status' => OrderStatus::Completed]);

        $this->get($order->tracking_url)->assertInertia(fn ($page) => $page
            ->where('timeline.steps.3.state', 'done')
            ->where('timeline.is_finished', true)
            ->whereNot('timeline.steps.1.reached_at', null));
    }

    public function test_cancelled_orders_show_a_notice_instead_of_progress(): void
    {
        $order = $this->placeOrder();
        $order->update(['status' => OrderStatus::Cancelled]);

        $this->get($order->tracking_url)->assertInertia(fn ($page) => $page
            ->where('timeline.notice.title', 'Order cancelled')
            ->where('timeline.steps.0.state', 'upcoming'));
    }

    public function test_an_unknown_link_redirects_home_with_a_friendly_message(): void
    {
        $this->get('/orders/track/not-a-real-token')
            ->assertRedirect(route('home'))
            ->assertSessionHas('error');
    }

    public function test_customers_are_emailed_at_each_milestone_but_not_for_internal_statuses(): void
    {
        $order = $this->placeOrder();

        $order->update(['status' => OrderStatus::PaymentConfirmed]);
        $order->update(['status' => OrderStatus::Processing]);
        $order->update(['status' => OrderStatus::Ready]);
        $this->flushDeferred();

        Mail::assertSent(OrderStatusUpdate::class, 2);
        Mail::assertSent(OrderStatusUpdate::class, fn ($mail) => $mail->hasTo('tola@example.com')
            && $mail->status === OrderStatus::Ready
            && str_contains($mail->render(), $order->tracking_url));
    }

    public function test_updating_something_other_than_status_sends_nothing(): void
    {
        $order = $this->placeOrder();

        $order->update(['notes' => 'Extra pepper']);
        $this->flushDeferred();

        Mail::assertNotSent(OrderStatusUpdate::class);
    }

    public function test_admin_can_set_the_new_statuses(): void
    {
        $order = $this->placeOrder();

        $this->actingAs($this->admin())
            ->patch("/admin/orders/{$order->id}", ['status' => 'ready'])
            ->assertSessionHasNoErrors();

        $this->assertSame(OrderStatus::Ready, $order->fresh()->status);
        Mail::assertSent(OrderStatusUpdate::class);
    }
}
