<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Mail\AbandonedCartReminder;
use App\Mail\ReviewRequest;
use App\Mail\WelcomeCoupon;
use App\Models\AbandonedCart;
use App\Models\Coupon;
use App\Models\NewsletterSubscriber;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductReview;
use App\Models\StoreSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class RetentionFeaturesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
        config(['mail.order_notifications' => ['owner@example.com']]);
    }

    private function product(float $price = 100): Product
    {
        return Product::query()->forceCreate([
            'name' => 'Jollof Rice',
            'price' => $price,
            'category' => 'Mains',
            'is_active' => true,
        ]);
    }

    private function orderPayload(Product $product, array $overrides = []): array
    {
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

    private function coupon(array $overrides = []): Coupon
    {
        return Coupon::query()->create([
            'code' => 'SAVE10',
            'type' => 'percent',
            'value' => 10,
            ...$overrides,
        ]);
    }

    // --- Coupons -----------------------------------------------------------

    public function test_coupon_reduces_subtotal_before_tax_on_the_order(): void
    {
        $product = $this->product();
        $this->coupon();

        $this->post('/orders', $this->orderPayload($product, ['coupon_code' => 'save10']))->assertSessionHasNoErrors();

        $order = Order::query()->sole();
        $this->assertSame('10.00', $order->discount);
        $this->assertSame('SAVE10', $order->coupon_code);
        $this->assertSame('11.70', $order->tax); // 13% of 90
        $this->assertSame('101.70', $order->total);
    }

    public function test_invalid_expired_and_used_up_coupons_are_rejected(): void
    {
        $product = $this->product();

        $this->post('/orders', $this->orderPayload($product, ['coupon_code' => 'NOPE']))->assertSessionHasErrors('coupon_code');

        $this->coupon(['code' => 'OLD', 'expires_at' => now()->subDay()]);
        $this->post('/orders', $this->orderPayload($product, ['coupon_code' => 'OLD']))->assertSessionHasErrors('coupon_code');

        $this->coupon(['code' => 'ONCE', 'usage_limit' => 1]);
        $this->post('/orders', $this->orderPayload($product, ['coupon_code' => 'ONCE']))->assertSessionHasNoErrors();
        $this->post('/orders', $this->orderPayload($product, ['coupon_code' => 'ONCE']))->assertSessionHasErrors('coupon_code');

        $this->assertSame(1, Order::query()->count());
    }

    public function test_minimum_order_and_max_discount_are_enforced(): void
    {
        $product = $this->product(50);
        $this->coupon(['code' => 'BIG', 'min_order' => 80]);
        $this->coupon(['code' => 'CAPPED', 'value' => 50, 'max_discount' => 5]);

        $this->post('/orders', $this->orderPayload($product, ['coupon_code' => 'BIG']))->assertSessionHasErrors('coupon_code');
        $this->post('/orders', $this->orderPayload($product, ['coupon_code' => 'CAPPED']))->assertSessionHasNoErrors();

        $this->assertSame('5.00', Order::query()->sole()->discount);
    }

    public function test_email_bound_first_order_coupon_only_works_once_for_that_customer(): void
    {
        $product = $this->product();
        $this->coupon(['code' => 'WELCOME-X', 'email' => 'customer@example.com', 'first_order_only' => true]);

        $this->post('/orders', $this->orderPayload($product, ['customer_email' => 'other@example.com', 'coupon_code' => 'WELCOME-X']))
            ->assertSessionHasErrors('coupon_code');

        $this->post('/orders', $this->orderPayload($product, ['coupon_code' => 'WELCOME-X']))->assertSessionHasNoErrors();

        // A second coupon for the same customer is refused: they already ordered.
        $this->coupon(['code' => 'FIRST', 'first_order_only' => true]);
        $this->post('/orders', $this->orderPayload($product, ['coupon_code' => 'FIRST']))->assertSessionHasErrors('coupon_code');
    }

    public function test_an_unpaid_stripe_checkout_does_not_use_up_a_coupon(): void
    {
        $product = $this->product();
        $coupon = $this->coupon(['usage_limit' => 1]);

        Order::query()->create([
            'customer_name' => 'A', 'customer_email' => 'customer@example.com', 'subtotal' => 10, 'tax' => 1, 'delivery_fee' => 0,
            'total' => 11, 'collection_method' => 'pickup', 'status' => OrderStatus::Pending, 'payment_status' => 'unpaid',
            'payment_method' => 'stripe', 'coupon_id' => $coupon->id,
        ]);

        $this->post('/orders', $this->orderPayload($product, ['coupon_code' => 'SAVE10']))->assertSessionHasNoErrors();
    }

    public function test_validate_endpoint_returns_the_saving_or_a_message(): void
    {
        $product = $this->product();
        $this->coupon();
        $items = [['product_id' => $product->id, 'quantity' => 2]];

        $this->postJson('/coupons/validate', ['code' => 'SAVE10', 'items' => $items])
            ->assertOk()
            ->assertJson(['code' => 'SAVE10', 'discount' => 20, 'description' => '10% off']);

        $this->postJson('/coupons/validate', ['code' => 'WRONG', 'items' => $items])
            ->assertStatus(422)
            ->assertJsonStructure(['message']);
    }

    // --- Welcome offer -----------------------------------------------------

    public function test_subscribing_issues_a_single_use_welcome_code_and_emails_it(): void
    {
        $this->post('/newsletter', ['name' => 'Ada', 'email' => 'Ada@Example.com'])->assertSessionHasNoErrors();

        $coupon = Coupon::query()->sole();
        $this->assertTrue($coupon->is_welcome);
        $this->assertSame('ada@example.com', $coupon->email);
        $this->assertSame('5.00', $coupon->value);
        $this->assertSame(1, $coupon->usage_limit);
        $this->assertTrue($coupon->first_order_only);
        $this->assertSame(1, NewsletterSubscriber::query()->count());
        Mail::assertSent(WelcomeCoupon::class, fn ($mail) => $mail->hasTo('ada@example.com'));

        // Subscribing again re-sends the same code instead of creating another.
        $this->post('/newsletter', ['name' => 'Ada', 'email' => 'ada@example.com']);
        $this->assertSame(1, Coupon::query()->count());
    }

    public function test_no_welcome_code_when_the_offer_is_off_or_the_customer_already_ordered(): void
    {
        StoreSetting::current()->update(['welcome_offer_enabled' => false]);
        $this->post('/newsletter', ['name' => 'Ada', 'email' => 'ada@example.com']);
        $this->assertSame(0, Coupon::query()->count());
        Mail::assertNotSent(WelcomeCoupon::class);

        StoreSetting::current()->update(['welcome_offer_enabled' => true]);
        $this->post('/orders', $this->orderPayload($this->product(), ['customer_email' => 'bob@example.com']));
        $this->post('/newsletter', ['name' => 'Bob', 'email' => 'bob@example.com']);
        $this->assertSame(0, Coupon::query()->count());
    }

    public function test_welcome_offer_is_shared_with_visitors_unless_disabled_or_admin(): void
    {
        $this->get('/')->assertInertia(fn ($page) => $page->where('welcomeOffer.percent', 5)->where('welcomeOffer.delay_seconds', 8));

        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $this->actingAs($admin)->get('/')->assertInertia(fn ($page) => $page->where('welcomeOffer', null));

        StoreSetting::current()->update(['welcome_offer_enabled' => false]);
        $this->app['auth']->forgetGuards();
        $this->get('/')->assertInertia(fn ($page) => $page->where('welcomeOffer', null));
    }

    // --- Admin -------------------------------------------------------------

    public function test_admin_can_manage_coupons_and_the_welcome_offer(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);

        $this->actingAs($admin)->post('/admin/coupons', [
            'code' => 'summer15', 'type' => 'percent', 'value' => 15, 'first_order_only' => false, 'is_active' => true,
        ])->assertSessionHasNoErrors();

        $coupon = Coupon::query()->where('is_welcome', false)->sole();
        $this->assertSame('SUMMER15', $coupon->code);

        $this->put("/admin/coupons/{$coupon->id}", [
            'code' => 'SUMMER15', 'type' => 'fixed', 'value' => 4, 'first_order_only' => true, 'is_active' => false,
        ])->assertSessionHasNoErrors();
        $this->assertSame('fixed', $coupon->fresh()->type);

        $this->put('/admin/coupons/welcome-offer', [
            'welcome_offer_enabled' => false, 'welcome_discount_percent' => 8, 'welcome_valid_days' => 7,
            'welcome_delay_seconds' => 3, 'welcome_headline' => 'Hello!',
        ])->assertSessionHasNoErrors();

        $settings = StoreSetting::current();
        $this->assertFalse($settings->welcome_offer_enabled);
        $this->assertSame('8.00', $settings->welcome_discount_percent);

        $this->get('/admin/coupons')->assertOk();
        $this->delete("/admin/coupons/{$coupon->id}");
        $this->assertSame(0, Coupon::query()->where('is_welcome', false)->count());
    }

    public function test_guests_and_customers_cannot_reach_coupon_admin(): void
    {
        $this->get('/admin/coupons')->assertRedirect('/login');
        $this->actingAs(User::factory()->create())->get('/admin/coupons')->assertForbidden();
    }

    // --- Abandoned carts ---------------------------------------------------

    public function test_cart_capture_then_reminder_email_and_recovery(): void
    {
        $product = $this->product();
        $payload = ['email' => 'Hungry@Example.com', 'name' => 'Hana', 'items' => [['product_id' => $product->id, 'quantity' => 2]]];

        $this->postJson('/cart/capture', $payload)->assertOk();
        $cart = AbandonedCart::query()->sole();
        $this->assertSame('hungry@example.com', $cart->email);

        // Too soon: nothing is sent yet.
        $this->artisan('carts:send-reminders')->assertSuccessful();
        Mail::assertNotSent(AbandonedCartReminder::class);

        $this->travel(2)->hours();
        $this->artisan('carts:send-reminders')->assertSuccessful();
        Mail::assertSent(AbandonedCartReminder::class, fn ($mail) => $mail->hasTo('hungry@example.com'));

        // Only one reminder per cart.
        $this->artisan('carts:send-reminders');
        Mail::assertSent(AbandonedCartReminder::class, 1);

        $this->get(route('cart.recover', $cart->token))
            ->assertRedirect(route('checkout'))
            ->assertSessionHas('recoveredCart.items.0.quantity', 2);
    }

    public function test_placing_the_order_clears_the_abandoned_cart(): void
    {
        $product = $this->product();
        $this->postJson('/cart/capture', [
            'email' => 'customer@example.com', 'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertOk();

        $this->post('/orders', $this->orderPayload($product));

        $this->assertSame(0, AbandonedCart::query()->count());
    }

    // --- Review requests ---------------------------------------------------

    public function test_review_request_is_sent_once_after_the_delay_for_unreviewed_dishes(): void
    {
        $product = $this->product();
        $this->post('/orders', $this->orderPayload($product));
        $order = Order::query()->sole();

        $order->update(['status' => OrderStatus::Completed]);
        $this->assertNotNull($order->fresh()->completed_at);

        $this->artisan('orders:send-review-requests');
        Mail::assertNotSent(ReviewRequest::class);

        $this->travel(3)->days();
        $this->artisan('orders:send-review-requests');
        Mail::assertSent(ReviewRequest::class, fn ($mail) => $mail->hasTo('customer@example.com') && $mail->products->count() === 1);

        $this->artisan('orders:send-review-requests');
        Mail::assertSent(ReviewRequest::class, 1);
    }

    public function test_dishes_the_customer_already_reviewed_are_skipped(): void
    {
        $product = $this->product();
        $this->post('/orders', $this->orderPayload($product));
        Order::query()->sole()->update(['status' => OrderStatus::Delivered]);
        ProductReview::query()->create([
            'product_id' => $product->id, 'customer_name' => 'T', 'customer_email' => 'customer@example.com',
            'rating' => 5, 'comment' => 'Great', 'is_approved' => true,
        ]);

        $this->travel(3)->days();
        $this->artisan('orders:send-review-requests');

        Mail::assertNotSent(ReviewRequest::class);
    }

    // --- Reorder -----------------------------------------------------------

    public function test_customer_can_fetch_current_cart_lines_for_a_past_order(): void
    {
        $user = User::factory()->create();
        $product = $this->product(12.5);
        $this->actingAs($user)->post('/orders', $this->orderPayload($product, ['items' => [['product_id' => $product->id, 'quantity' => 3]]]));
        $order = Order::query()->sole();
        $order->update(['user_id' => $user->id]);

        $product->update(['price' => 14]);

        $this->getJson("/dashboard/orders/{$order->id}/reorder")
            ->assertOk()
            ->assertJsonPath('items.0.quantity', 3)
            ->assertJsonPath('items.0.price', 14)
            ->assertJsonPath('unavailable', []);

        $product->update(['is_active' => false]);
        $this->getJson("/dashboard/orders/{$order->id}/reorder")->assertOk()->assertJsonPath('items', [])->assertJsonCount(1, 'unavailable');
    }

    public function test_customers_cannot_reorder_someone_elses_order(): void
    {
        $this->post('/orders', $this->orderPayload($this->product()));
        $order = Order::query()->sole();

        $this->actingAs(User::factory()->create())->getJson("/dashboard/orders/{$order->id}/reorder")->assertNotFound();
    }
}
