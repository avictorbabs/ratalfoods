<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Mail\NewOrderReceived;
use App\Mail\OrderConfirmation;
use App\Models\DeliveryFee;
use App\Models\Order;
use App\Models\Product;
use App\Models\RecurringOrder;
use App\Models\StoreSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class DeliveryFeeSwitchTest extends TestCase
{
    use RefreshDatabase;

    private const NOTE = 'We will contact you to confirm order and agree on a delivery fee.';

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
        config(['mail.order_notifications' => ['owner@example.com']]);
        DeliveryFee::query()->create(['name' => 'Windsor', 'match_terms' => 'Windsor', 'fee' => 8, 'is_active' => true]);
    }

    private function deliveryOrder(string $address = '1 Main St, Windsor')
    {
        $product = Product::query()->firstOrCreate(['name' => 'Jollof'], ['price' => 100, 'category' => 'Mains', 'is_active' => true]);

        return $this->post('/orders', [
            'customer_name' => 'Pat', 'customer_email' => 'pat@example.com', 'customer_phone' => '555-0100',
            'collection_method' => 'delivery_request', 'delivery_address' => $address,
            'delivery_date' => now()->addDay()->toDateString(), 'delivery_time' => '16:00',
            'payment_method' => 'cash_on_delivery', 'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ]);
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => UserRole::Admin]);
    }

    public function test_by_default_delivery_is_charged_as_before(): void
    {
        $this->get('/checkout')->assertInertia(fn ($page) => $page->where('deliveryFeeEnabled', true));

        $this->deliveryOrder()->assertSessionHasNoErrors();

        $order = Order::query()->sole();
        $this->assertSame('8.00', $order->delivery_fee);
        $this->assertSame('Windsor', $order->delivery_zone);
        $this->assertFalse($order->delivery_fee_pending);
        $this->assertSame('121.00', $order->total); // 100 + 13 tax + 8 delivery
    }

    public function test_the_admin_can_switch_delivery_fees_off_and_on(): void
    {
        $this->actingAs($this->admin());

        $this->get('/admin/delivery-fees')->assertInertia(fn ($page) => $page->where('feesEnabled', true));

        $this->put('/admin/delivery-fees/toggle', ['enabled' => false])->assertSessionHas('success');
        $this->assertFalse(StoreSetting::current()->delivery_fee_enabled);
        $this->get('/admin/delivery-fees')->assertInertia(fn ($page) => $page->where('feesEnabled', false));

        $this->put('/admin/delivery-fees/toggle', ['enabled' => true]);
        $this->assertTrue(StoreSetting::current()->delivery_fee_enabled);

        $this->put('/admin/delivery-fees/toggle', [])->assertSessionHasErrors('enabled');
    }

    public function test_customers_cannot_use_the_switch(): void
    {
        $this->actingAs(User::factory()->create())->put('/admin/delivery-fees/toggle', ['enabled' => false])->assertForbidden();
        $this->assertTrue(StoreSetting::current()->delivery_fee_enabled);
    }

    public function test_with_fees_off_checkout_knows_and_no_fee_is_added_to_the_total(): void
    {
        StoreSetting::current()->update(['delivery_fee_enabled' => false]);

        $this->get('/checkout')->assertInertia(fn ($page) => $page->where('deliveryFeeEnabled', false));

        $this->deliveryOrder()->assertSessionHasNoErrors();

        $order = Order::query()->sole();
        $this->assertSame('0.00', $order->delivery_fee);
        $this->assertNull($order->delivery_zone);
        $this->assertTrue($order->delivery_fee_pending);
        $this->assertSame('113.00', $order->total); // 100 + 13 tax, no delivery
    }

    public function test_with_fees_off_an_address_outside_every_zone_is_still_accepted(): void
    {
        StoreSetting::current()->update(['delivery_fee_enabled' => false]);

        $this->deliveryOrder('12 Faraway Road, Somewhere Else')->assertSessionHasNoErrors();

        $this->assertSame(1, Order::query()->count());
    }

    public function test_with_fees_on_an_unmatched_address_is_still_refused(): void
    {
        $this->deliveryOrder('12 Faraway Road, Somewhere Else')->assertSessionHasErrors('delivery_address');

        $this->assertSame(0, Order::query()->count());
    }

    public function test_pickup_orders_are_never_marked_as_pending_a_fee(): void
    {
        StoreSetting::current()->update(['delivery_fee_enabled' => false]);
        $product = Product::query()->forceCreate(['name' => 'Quick', 'price' => 10, 'category' => 'Mains', 'is_active' => true]);

        $this->post('/orders', [
            'customer_name' => 'Pat', 'customer_email' => 'pat@example.com', 'customer_phone' => '555-0100',
            'collection_method' => 'pickup', 'pickup_date' => now()->addDays(2)->toDateString(), 'pickup_time' => '4:00 PM',
            'payment_method' => 'cash_on_delivery', 'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertSessionHasNoErrors();

        $this->assertFalse(Order::query()->sole()->delivery_fee_pending);
    }

    public function test_the_buyer_email_and_the_store_email_both_carry_the_note(): void
    {
        StoreSetting::current()->update(['delivery_fee_enabled' => false]);
        $this->deliveryOrder();
        $order = Order::query()->sole();

        $this->assertStringContainsString(self::NOTE, (new OrderConfirmation($order))->render());
        $this->assertStringContainsString('Delivery fee not set', (new NewOrderReceived($order))->render());
    }

    public function test_emails_for_normal_orders_do_not_mention_it(): void
    {
        $this->deliveryOrder();
        $order = Order::query()->sole();

        $this->assertStringNotContainsString(self::NOTE, (new OrderConfirmation($order))->render());
        $this->assertStringNotContainsString('Delivery fee not set', (new NewOrderReceived($order))->render());
    }

    public function test_the_order_page_and_tracking_page_show_the_note_for_those_orders_only(): void
    {
        StoreSetting::current()->update(['delivery_fee_enabled' => false]);
        $this->deliveryOrder();
        $pending = Order::query()->sole();

        $this->get('/checkout')->assertInertia(fn ($page) => $page->where('flash.orderComplete.delivery_fee_pending', true));
        $this->get($pending->tracking_url)->assertInertia(fn ($page) => $page->where('order.delivery_fee_pending', true));

        // Switching it back on later does not change what an earlier order says.
        StoreSetting::current()->update(['delivery_fee_enabled' => true]);
        $this->get($pending->tracking_url)->assertInertia(fn ($page) => $page->where('order.delivery_fee_pending', true));
    }

    public function test_repeat_delivery_orders_follow_the_switch_too(): void
    {
        StoreSetting::current()->update(['delivery_fee_enabled' => false]);
        $user = User::factory()->create();
        $product = Product::query()->forceCreate(['name' => 'Jollof', 'price' => 20, 'category' => 'Mains', 'is_active' => true]);

        RecurringOrder::query()->create([
            'user_id' => $user->id, 'status' => 'active', 'frequency' => 'weekly', 'collection_method' => 'delivery_request',
            'customer_name' => 'Pat', 'customer_email' => 'pat@example.com', 'customer_phone' => '555-0100',
            'delivery_slot' => '16:30', 'delivery_address' => 'Nowhere in particular',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
            'next_service_date' => today()->addDay()->toDateString(), 'skipped_dates' => [],
        ]);

        $this->artisan('recurring:generate')->assertSuccessful();

        $order = Order::query()->sole();
        $this->assertTrue($order->delivery_fee_pending);
        $this->assertSame('0.00', $order->delivery_fee);
    }
}
