<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Models\LoyaltyTransaction;
use App\Models\Order;
use App\Models\Product;
use App\Models\StoreSetting;
use App\Models\User;
use App\Support\Loyalty;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class LoyaltyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
        config(['mail.order_notifications' => ['owner@example.com']]);
    }

    private function customer(): User
    {
        return User::factory()->create(['email' => 'pts@example.com']);
    }

    private function order(?User $user, array $extra = [], float $price = 100): Order
    {
        $product = Product::query()->firstOrCreate(['name' => 'Jollof'], ['price' => $price, 'category' => 'Mains', 'is_active' => true]);
        $product->update(['price' => $price]);

        $payload = [
            'customer_name' => 'Pat', 'customer_email' => 'pts@example.com', 'customer_phone' => '555-0100',
            'collection_method' => 'pickup', 'pickup_date' => now()->addDay()->toDateString(), 'pickup_time' => '4:00 PM',
            'payment_method' => 'cash_on_delivery', 'items' => [['product_id' => $product->id, 'quantity' => 1]],
            ...$extra,
        ];

        ($user ? $this->actingAs($user) : $this)->post('/orders', $payload);

        return Order::query()->latest('id')->firstOrFail();
    }

    private function give(User $user, int $points): void
    {
        Loyalty::adjust($user, $points, 'test grant');
    }

    public function test_points_are_earned_when_an_order_is_completed_not_when_placed(): void
    {
        $user = $this->customer();
        $order = $this->order($user);

        $this->assertSame(0, Loyalty::balance($user));

        $order->update(['status' => OrderStatus::Completed]);

        $this->assertSame(100, Loyalty::balance($user)); // 1 point per $1 of the $100 subtotal
        $this->assertSame(100, $order->fresh()->loyalty_points_earned);
    }

    public function test_points_are_only_awarded_once_per_order(): void
    {
        $user = $this->customer();
        $order = $this->order($user);

        $order->update(['status' => OrderStatus::Completed]);
        $order->update(['status' => OrderStatus::Delivered]);

        $this->assertSame(100, Loyalty::balance($user));
        $this->assertSame(1, LoyaltyTransaction::query()->where('type', 'earn')->count());
    }

    public function test_guests_do_not_earn_and_the_program_switch_stops_earning(): void
    {
        $guest = $this->order(null);
        $guest->update(['status' => OrderStatus::Completed]);
        $this->assertSame(0, LoyaltyTransaction::query()->count());

        StoreSetting::current()->update(['loyalty_enabled' => false]);
        $user = $this->customer();
        $order = $this->order($user);
        $order->update(['status' => OrderStatus::Completed]);

        $this->assertSame(0, Loyalty::balance($user));
    }

    public function test_spending_points_takes_them_off_the_order_before_tax_and_uses_the_balance(): void
    {
        $user = $this->customer();
        $this->give($user, 500); // 500 points x $0.02 = $10, under the 50% cap of $100

        $order = $this->order($user, ['use_points' => true]);

        $this->assertSame(500, $order->loyalty_points_redeemed);
        $this->assertSame('10.00', $order->loyalty_discount);
        $this->assertSame('11.70', $order->tax); // 13% of $90
        $this->assertSame('101.70', $order->total);
        $this->assertSame(0, Loyalty::balance($user));
    }

    public function test_spending_is_capped_by_the_order_percentage(): void
    {
        $user = $this->customer();
        $this->give($user, 100000);

        $order = $this->order($user, ['use_points' => true], 10); // 50% of $10 = $5 = 250 points

        $this->assertSame(250, $order->loyalty_points_redeemed);
        $this->assertSame('5.00', $order->loyalty_discount);
        $this->assertSame(99750, Loyalty::balance($user));
    }

    public function test_using_points_below_the_minimum_or_as_a_guest_is_refused_with_a_message(): void
    {
        $user = $this->customer();
        $this->give($user, 50); // below the 100 minimum

        $this->actingAs($user)->post('/orders', [
            'customer_name' => 'Pat', 'customer_email' => 'pts@example.com', 'customer_phone' => '555-0100',
            'collection_method' => 'pickup', 'pickup_date' => now()->addDay()->toDateString(), 'pickup_time' => '4:00 PM',
            'payment_method' => 'cash_on_delivery', 'use_points' => true,
            'items' => [['product_id' => Product::query()->forceCreate(['name' => 'X', 'price' => 50, 'category' => 'M', 'is_active' => true])->id, 'quantity' => 1]],
        ])->assertSessionHasErrors('use_points');

        $this->assertSame(0, Order::query()->count());
        $this->assertSame(50, Loyalty::balance($user));

        auth()->logout();
        $this->post('/orders', [
            'customer_name' => 'Pat', 'customer_email' => 'g@example.com', 'customer_phone' => '555-0100',
            'collection_method' => 'pickup', 'pickup_date' => now()->addDay()->toDateString(), 'pickup_time' => '4:00 PM',
            'payment_method' => 'cash_on_delivery', 'use_points' => true,
            'items' => [['product_id' => Product::query()->first()->id, 'quantity' => 1]],
        ])->assertSessionHasErrors('use_points');
    }

    public function test_cancelling_an_order_returns_spent_points_and_removes_earned_ones(): void
    {
        $user = $this->customer();
        $this->give($user, 500);
        $order = $this->order($user, ['use_points' => true]);
        $this->assertSame(0, Loyalty::balance($user));

        $order->update(['status' => OrderStatus::Cancelled]);

        $this->assertSame(500, Loyalty::balance($user));

        // A completed order later refunded loses what it earned.
        $second = $this->order($user);
        $second->update(['status' => OrderStatus::Completed]);
        $this->assertSame(600, Loyalty::balance($user));

        $second->update(['status' => OrderStatus::Refunded]);
        $this->assertSame(500, Loyalty::balance($user));
    }

    public function test_oldest_points_are_spent_first_and_expired_points_disappear(): void
    {
        $user = $this->customer();
        $this->give($user, 100);
        $this->travel(1)->days();
        $this->give($user, 100);

        $this->order($user, ['use_points' => true], 4); // 4 * 50% = $2 = 100 points

        $lots = LoyaltyTransaction::query()->where('type', 'adjust')->orderBy('id')->pluck('remaining')->all();
        $this->assertSame([0, 100], $lots);

        $this->travel(13)->months();
        $this->assertSame(0, Loyalty::balance($user));

        $this->artisan('loyalty:expire')->assertSuccessful();
        $this->assertSame(-100, LoyaltyTransaction::query()->where('type', 'expire')->sum('points'));
    }

    public function test_a_guest_order_earns_points_once_the_account_is_verified(): void
    {
        $order = $this->order(null);
        $order->update(['status' => OrderStatus::Completed]);

        $user = User::factory()->unverified()->create(['email' => 'pts@example.com']);
        event(new Verified($user->fresh()->forceFill(['email_verified_at' => now()])));

        $this->assertSame($user->id, $order->fresh()->user_id);
    }

    public function test_the_loyalty_prop_is_shared_and_hidden_when_switched_off(): void
    {
        $user = $this->customer();
        $this->give($user, 250);

        $this->actingAs($user)->get('/')->assertInertia(fn ($page) => $page
            ->where('loyalty.balance', 250)
            ->where('loyalty.point_value', 0.02));

        StoreSetting::current()->update(['loyalty_enabled' => false]);
        $this->get('/')->assertInertia(fn ($page) => $page->where('loyalty', null));
    }

    public function test_customer_points_page_and_admin_management(): void
    {
        $user = $this->customer();
        $this->give($user, 300);

        $this->actingAs($user)->get('/dashboard/points')->assertOk()->assertInertia(fn ($page) => $page
            ->where('balance', 300)
            ->where('transactions.data.0.points', 300));

        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $this->actingAs($admin)->put('/admin/loyalty', [
            'loyalty_enabled' => false, 'loyalty_points_per_dollar' => 2, 'loyalty_point_value' => 0.01,
            'loyalty_min_redeem' => 50, 'loyalty_max_percent' => 30, 'loyalty_expiry_months' => '',
        ])->assertSessionHasNoErrors();

        $settings = StoreSetting::current();
        $this->assertFalse($settings->loyalty_enabled);
        $this->assertNull($settings->loyalty_expiry_months);

        $this->post('/admin/loyalty/adjust', ['user_id' => $user->id, 'points' => -100, 'note' => 'Correction'])->assertSessionHasNoErrors();
        $this->assertSame(200, Loyalty::balance($user));

        $this->post('/admin/loyalty/adjust', ['user_id' => $user->id, 'points' => 0, 'note' => 'x'])->assertSessionHasErrors('points');
        $this->get('/admin/loyalty?q=pts')->assertOk()->assertInertia(fn ($page) => $page->where('customers.0.balance', 200));
    }

    public function test_customers_cannot_reach_loyalty_admin(): void
    {
        $this->actingAs($this->customer())->get('/admin/loyalty')->assertForbidden();
    }
}
