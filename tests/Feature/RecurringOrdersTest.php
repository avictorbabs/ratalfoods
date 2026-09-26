<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Mail\NewOrderReceived;
use App\Mail\RecurringOrderProblem;
use App\Mail\RecurringOrderUpcoming;
use App\Models\DeliveryFee;
use App\Models\Order;
use App\Models\Product;
use App\Models\RecurringOrder;
use App\Models\User;
use App\Support\RecurringOrders;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class RecurringOrdersTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
        config(['mail.order_notifications' => ['owner@example.com']]);

        $this->user = User::factory()->create(['email' => 'office@example.com']);
        $this->product = Product::query()->forceCreate(['name' => 'Jollof', 'price' => 20, 'category' => 'Mains', 'is_active' => true]);
    }

    private function place(array $extra = [], ?User $as = null): TestResponse
    {
        return $this->actingAs($as ?? $this->user)->post('/orders', [
            'customer_name' => 'Office Olu', 'customer_email' => 'office@example.com', 'customer_phone' => '555-0100',
            'collection_method' => 'pickup', 'pickup_date' => now()->addDays(3)->toDateString(), 'pickup_time' => '12:00 PM',
            'payment_method' => 'cash_on_delivery', 'items' => [['product_id' => $this->product->id, 'quantity' => 3]],
            ...$extra,
        ]);
    }

    private function schedule(array $extra = []): RecurringOrder
    {
        return RecurringOrder::query()->create([
            'user_id' => $this->user->id, 'status' => 'active', 'frequency' => 'weekly', 'collection_method' => 'pickup',
            'customer_name' => 'Office Olu', 'customer_email' => 'office@example.com', 'customer_phone' => '555-0100',
            'pickup_slot' => '12:00 PM', 'items' => [['product_id' => $this->product->id, 'quantity' => 3]],
            'next_service_date' => today()->addDay()->toDateString(), 'skipped_dates' => [],
            ...$extra,
        ]);
    }

    // --- Setting up -------------------------------------------------------

    public function test_ticking_repeat_at_checkout_creates_a_schedule_starting_after_the_first_order(): void
    {
        $this->place(['repeat' => 'weekly'])->assertSessionHasNoErrors();

        $recurring = RecurringOrder::query()->sole();
        $first = Order::query()->sole();

        $this->assertSame($recurring->id, $first->recurring_order_id);
        $this->assertSame(now()->addDays(3)->toDateString(), $first->recurring_for->toDateString());
        $this->assertSame(now()->addDays(10)->toDateString(), $recurring->next_service_date->toDateString());
        $this->assertSame('12:00 PM', $recurring->pickup_slot);
        $this->assertSame(3, $recurring->items[0]['quantity']);
    }

    public function test_every_two_weeks_and_an_end_date_are_respected(): void
    {
        $this->place(['repeat' => 'biweekly', 'repeat_until' => now()->addDays(40)->toDateString()])->assertSessionHasNoErrors();

        $recurring = RecurringOrder::query()->sole();

        $this->assertSame(now()->addDays(17)->toDateString(), $recurring->next_service_date->toDateString());
        $this->assertSame(now()->addDays(40)->toDateString(), $recurring->ends_on->toDateString());
    }

    public function test_repeat_is_refused_with_a_clear_message_for_card_payments_guests_and_unverified_accounts(): void
    {
        $this->place(['repeat' => 'weekly', 'payment_method' => 'stripe'])->assertSessionHasErrors('repeat');

        auth()->logout();
        $this->post('/orders', [
            'customer_name' => 'G', 'customer_email' => 'g@example.com', 'customer_phone' => '555', 'collection_method' => 'pickup',
            'pickup_date' => now()->addDay()->toDateString(), 'pickup_time' => '1:00 PM', 'payment_method' => 'cash_on_delivery',
            'repeat' => 'weekly', 'items' => [['product_id' => $this->product->id, 'quantity' => 1]],
        ])->assertSessionHasErrors('repeat');

        $unverified = User::factory()->unverified()->create();
        $this->place(['repeat' => 'weekly'], $unverified)->assertSessionHasErrors('repeat');

        // Nothing was half-created.
        $this->assertSame(0, Order::query()->count());
        $this->assertSame(0, RecurringOrder::query()->count());
    }

    public function test_the_end_date_cannot_be_before_the_first_order_and_the_schedule_count_is_capped(): void
    {
        $this->place(['repeat' => 'weekly', 'repeat_until' => now()->toDateString()])->assertSessionHasErrors('repeat');

        for ($i = 0; $i < 3; $i++) {
            $this->schedule();
        }

        $this->place(['repeat' => 'weekly'])->assertSessionHasErrors('repeat');
        $this->assertSame(3, RecurringOrder::query()->count());
    }

    // --- Creating the orders ----------------------------------------------

    public function test_the_generator_creates_a_pickup_order_ahead_of_time_and_emails_a_skip_link(): void
    {
        $recurring = $this->schedule(['next_service_date' => today()->addDay()->toDateString()]);

        $this->artisan('recurring:generate')->assertSuccessful();

        $order = Order::query()->sole();
        $this->assertSame($recurring->id, $order->recurring_order_id);
        $this->assertSame(OrderStatus::Pending, $order->status);
        $this->assertSame('cash_on_delivery', $order->payment_method);
        $this->assertSame('60.00', $order->subtotal);
        $this->assertStringContainsString('12:00 PM', $order->pickup_time);
        $this->assertStringContainsString('Recurring order', $order->notes);
        $this->assertSame(today()->addDays(8)->toDateString(), $recurring->fresh()->next_service_date->toDateString());

        Mail::assertSent(RecurringOrderUpcoming::class, fn ($mail) => $mail->hasTo('office@example.com')
            && str_contains($mail->skipUrl, 'signature=')
            && str_contains($mail->render(), 'Skip this order'));
        Mail::assertSent(NewOrderReceived::class, fn ($mail) => $mail->hasTo('owner@example.com'));
    }

    public function test_orders_are_not_created_before_the_lead_window_or_twice(): void
    {
        $this->schedule(['next_service_date' => today()->addDays(6)->toDateString()]);

        $this->artisan('recurring:generate');
        $this->assertSame(0, Order::query()->count());

        $this->travel(5)->days();
        $this->artisan('recurring:generate');
        $this->artisan('recurring:generate');

        $this->assertSame(1, Order::query()->count());
    }

    public function test_delivery_schedules_price_delivery_at_todays_fee_and_dropped_dishes_are_noted(): void
    {
        DeliveryFee::query()->create(['name' => 'Windsor', 'match_terms' => 'Windsor', 'fee' => 5, 'is_active' => true]);
        $gone = Product::query()->forceCreate(['name' => 'Old Special', 'price' => 10, 'category' => 'Mains', 'is_active' => false]);

        $this->schedule([
            'collection_method' => 'delivery_request', 'pickup_slot' => null, 'delivery_slot' => '16:30',
            'delivery_address' => '1 Main St, Windsor',
            'items' => [['product_id' => $this->product->id, 'quantity' => 1], ['product_id' => $gone->id, 'quantity' => 1]],
        ]);

        $this->artisan('recurring:generate');

        $order = Order::query()->sole();
        $this->assertSame('5.00', $order->delivery_fee);
        $this->assertSame('Windsor', $order->delivery_zone);
        $this->assertSame(1, $order->items()->count());
        $this->assertStringContainsString('4:30 PM', $order->delivery_time_preference);
        $this->assertStringContainsString('Old Special', $order->notes);
    }

    public function test_a_problem_emails_the_customer_and_the_schedule_keeps_going(): void
    {
        $recurring = $this->schedule(['items' => [['product_id' => 99999, 'quantity' => 1]]]);

        $this->artisan('recurring:generate')->assertSuccessful();

        $this->assertSame(0, Order::query()->count());
        Mail::assertSent(RecurringOrderProblem::class, fn ($mail) => $mail->hasTo('office@example.com')
            && str_contains($mail->render(), 'None of the dishes'));
        $this->assertSame('active', $recurring->fresh()->status);
        $this->assertSame(today()->addDays(8)->toDateString(), $recurring->fresh()->next_service_date->toDateString());
    }

    public function test_an_unmatched_delivery_address_is_explained_not_crashed(): void
    {
        $this->schedule(['collection_method' => 'delivery_request', 'pickup_slot' => null, 'delivery_slot' => '16:00', 'delivery_address' => 'Nowhere']);

        $this->artisan('recurring:generate')->assertSuccessful();

        Mail::assertSent(RecurringOrderProblem::class, fn ($mail) => str_contains($mail->render(), 'delivery area'));
    }

    public function test_paused_and_ended_schedules_create_nothing(): void
    {
        $this->schedule(['status' => 'paused']);
        $this->schedule(['ends_on' => today()->subDay()->toDateString()]);

        $this->artisan('recurring:generate');

        $this->assertSame(0, Order::query()->count());
        $this->assertSame('ended', RecurringOrder::query()->where('status', '!=', 'paused')->sole()->status);
    }

    // --- Skipping ---------------------------------------------------------

    public function test_the_signed_link_needs_a_confirmation_click_and_then_cancels_the_pending_order(): void
    {
        $recurring = $this->schedule();
        $this->artisan('recurring:generate');
        $order = Order::query()->sole();
        $date = CarbonImmutable::parse($order->recurring_for);
        $url = RecurringOrders::skipUrl($recurring, $date);

        // A plain visit (like an email scanner) changes nothing.
        $this->get($url)->assertOk()->assertInertia(fn ($page) => $page->component('public/RecurringSkip')->where('already_skipped', false));
        $this->assertSame(OrderStatus::Pending, $order->fresh()->status);

        $this->post($url)->assertSessionHasNoErrors();
        $this->assertSame(OrderStatus::Cancelled, $order->fresh()->status);
        $this->assertTrue($recurring->fresh()->isSkipped($date->toDateString()));
        $this->get($url)->assertInertia(fn ($page) => $page->where('already_skipped', true));
    }

    public function test_it_is_too_late_to_skip_once_the_kitchen_has_started(): void
    {
        $recurring = $this->schedule();
        $this->artisan('recurring:generate');
        $order = Order::query()->sole();
        $order->update(['status' => OrderStatus::Processing]);
        $url = RecurringOrders::skipUrl($recurring, CarbonImmutable::parse($order->recurring_for));

        $this->post($url)->assertSessionHas('error');
        $this->assertSame(OrderStatus::Processing, $order->fresh()->status);
        $this->assertFalse($recurring->fresh()->isSkipped($order->recurring_for->toDateString()));
    }

    public function test_tampered_or_unsigned_skip_links_are_refused(): void
    {
        $recurring = $this->schedule();

        $this->get("/recurring/{$recurring->id}/skip/".today()->addDay()->toDateString())->assertForbidden();

        $signed = URL::signedRoute('recurring.skip', ['recurring' => $recurring->id, 'date' => today()->addDay()->toDateString()]);
        $this->post(str_replace(today()->addDay()->toDateString(), today()->addDays(2)->toDateString(), $signed))->assertForbidden();
        $this->assertSame([], $recurring->fresh()->skipped_dates);
    }

    public function test_a_skipped_date_before_generation_is_passed_over(): void
    {
        $recurring = $this->schedule();
        RecurringOrders::skip($recurring, CarbonImmutable::parse($recurring->next_service_date));

        $this->artisan('recurring:generate');

        $this->assertSame(0, Order::query()->count());
        $this->assertSame(today()->addDays(8)->toDateString(), $recurring->fresh()->next_service_date->toDateString());
    }

    // --- Managing from the account ---------------------------------------

    public function test_customer_can_pause_resume_skip_and_cancel_from_their_account(): void
    {
        $recurring = $this->schedule();
        $this->artisan('recurring:generate');
        $order = Order::query()->sole();

        $this->actingAs($this->user)->get('/dashboard/recurring')->assertOk()->assertInertia(fn ($page) => $page
            ->component('public/dashboard/Recurring')
            ->where('schedules.0.items.0.name', 'Jollof')
            ->where('schedules.0.next_date', $order->recurring_for->toDateString()));

        $this->post("/dashboard/recurring/{$recurring->id}/skip")->assertSessionHas('success');
        $this->assertSame(OrderStatus::Cancelled, $order->fresh()->status);

        $this->post("/dashboard/recurring/{$recurring->id}/pause");
        $this->assertSame('paused', $recurring->fresh()->status);

        $this->post("/dashboard/recurring/{$recurring->id}/resume");
        $this->assertSame('active', $recurring->fresh()->status);

        $this->post("/dashboard/recurring/{$recurring->id}/cancel");
        $this->assertSame('cancelled', $recurring->fresh()->status);
        $this->get('/dashboard/recurring')->assertInertia(fn ($page) => $page->has('schedules', 0));
    }

    public function test_customers_cannot_touch_other_peoples_schedules(): void
    {
        $recurring = $this->schedule();
        $stranger = User::factory()->create();

        $this->actingAs($stranger)->post("/dashboard/recurring/{$recurring->id}/cancel")->assertNotFound();
        $this->assertSame('active', $recurring->fresh()->status);
    }

    public function test_skipping_with_nothing_coming_up_is_explained(): void
    {
        $recurring = $this->schedule(['ends_on' => today()->subDay()->toDateString(), 'next_service_date' => today()->subDays(3)->toDateString()]);

        $this->actingAs($this->user)->post("/dashboard/recurring/{$recurring->id}/skip")->assertSessionHas('error');
    }

    public function test_repeat_orders_are_flagged_for_the_admin(): void
    {
        $this->place(['repeat' => 'weekly']);

        $this->assertNotNull(Order::query()->sole()->toArray()['recurring_order_id']);
    }
}
