<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Order;
use App\Models\Product;
use App\Models\StoreSetting;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PickupInfoTest extends TestCase
{
    use RefreshDatabase;

    public function test_checkout_uses_store_settings_until_the_admin_overrides_them(): void
    {
        StoreSetting::current()->update(['opening_hours' => 'Tue–Sun: 12pm – 8pm', 'pickup_message' => 'Ready in 90 minutes']);

        $this->get('/checkout')->assertInertia(fn ($page) => $page
            ->where('pickupInfo.hours', 'Tue–Sun: 12pm – 8pm')
            ->where('pickupInfo.ready_time', 'Ready in 90 minutes')
            ->where('pickupInfo.heading', 'Store Hours')
            ->where('pickupInfo.note', 'Please choose a pickup time during store hours.'));
    }

    public function test_the_admin_can_edit_the_checkout_pickup_box_from_the_menu_page(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);

        $this->actingAs($admin)->get('/admin/pages/menu')->assertInertia(fn ($page) => $page
            ->where('pageContent.pickup_info.hours', 'Mon–Sat: 11am – 9pm'));

        $this->put('/admin/pages/menu', ['content' => ['pickup_info' => [
            'heading' => 'Opening hours', 'hours' => 'Mon–Fri: 10am – 6pm', 'ready_label' => 'Usually ready in',
            'ready_time' => '45 minutes', 'note' => 'Orders after 5pm are ready the next day.',
        ]]])->assertSessionHasNoErrors();

        $this->get('/checkout')->assertInertia(fn ($page) => $page
            ->where('pickupInfo.heading', 'Opening hours')
            ->where('pickupInfo.hours', 'Mon–Fri: 10am – 6pm')
            ->where('pickupInfo.ready_label', 'Usually ready in')
            ->where('pickupInfo.ready_time', '45 minutes')
            ->where('pickupInfo.note', 'Orders after 5pm are ready the next day.'));
    }

    public function test_a_blank_note_is_hidden_and_blank_hours_fall_back(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);

        $this->actingAs($admin)->put('/admin/pages/menu', ['content' => ['pickup_info' => ['hours' => '', 'note' => '']]]);

        $this->get('/checkout')->assertInertia(fn ($page) => $page
            ->where('pickupInfo.hours', 'Mon–Sat: 11am – 9pm')
            ->where('pickupInfo.note', ''));
    }

    private function pickupOrder(string $date, string $slot, bool $quick = false)
    {
        $product = Product::query()->firstOrCreate(
            ['name' => $quick ? 'Quick Bite' : 'Made To Order'],
            ['price' => 20, 'category' => 'Mains', 'is_active' => true, 'available_for_pickup' => $quick],
        );

        return $this->post('/orders', [
            'customer_name' => 'Pat', 'customer_email' => 'pat@example.com', 'customer_phone' => '555-0100',
            'collection_method' => 'pickup', 'pickup_date' => $date, 'pickup_time' => $slot,
            'payment_method' => 'cash_on_delivery', 'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ]);
    }

    public function test_pickup_must_be_at_least_the_lead_time_away_and_the_checkout_knows_the_earliest(): void
    {
        Mail::fake();
        $this->travelTo(CarbonImmutable::parse('2026-11-02 10:00', 'America/Toronto'));

        $this->get('/checkout')->assertInertia(fn ($page) => $page
            ->where('earliestPickup.date', '2026-11-03')
            ->where('earliestPickup.minutes', 600)
            ->where('earliestPickup.hours', 24));

        // Today and "tomorrow before the 24 hours are up" are refused with the earliest time in the message.
        $this->pickupOrder('2026-11-02', '8:00 PM')->assertSessionHasErrors('pickup_time');
        $this->pickupOrder('2026-11-03', '9:00 AM')->assertSessionHasErrors('pickup_time');
        $this->assertSame(0, Order::query()->count());

        // Exactly 24 hours ahead is fine, and so is any later day.
        $this->pickupOrder('2026-11-03', '11:00 AM')->assertSessionHasNoErrors();
        $this->pickupOrder('2026-11-05', '11:00 AM')->assertSessionHasNoErrors();
        $this->assertSame(2, Order::query()->count());
    }

    public function test_the_admin_can_change_the_lead_time(): void
    {
        Mail::fake();
        $this->travelTo(CarbonImmutable::parse('2026-11-02 10:00', 'America/Toronto'));
        $admin = User::factory()->create(['role' => UserRole::Admin]);

        $this->actingAs($admin)->put('/admin/pages/menu', ['content' => ['pickup_info' => ['lead_hours' => '48']]])->assertSessionHasNoErrors();

        $this->get('/checkout')->assertInertia(fn ($page) => $page->where('earliestPickup.date', '2026-11-04')->where('earliestPickup.hours', 48));
        $this->pickupOrder('2026-11-03', '5:00 PM')->assertSessionHasErrors('pickup_time');

        $this->put('/admin/pages/menu', ['content' => ['pickup_info' => ['lead_hours' => '0']]]);
        $this->pickupOrder('2026-11-02', '8:00 PM')->assertSessionHasNoErrors();
    }

    public function test_products_available_for_pickup_skip_the_lead_time_but_one_other_item_brings_it_back(): void
    {
        Mail::fake();
        $this->travelTo(CarbonImmutable::parse('2026-11-02 10:00', 'America/Toronto'));

        $this->get('/checkout')->assertInertia(fn ($page) => $page
            ->where('quickPickup.hours', 0)
            ->where('quickPickup.date', '2026-11-02')
            ->where('quickPickup.minutes', 600)
            ->where('earliestPickup.hours', 24));

        // Ticked "Available for pickup": order for later today, as before.
        $this->pickupOrder('2026-11-02', '8:00 PM', quick: true)->assertSessionHasNoErrors();
        $this->assertSame(1, Order::query()->count());

        // Unticked: the 24 hours apply.
        $this->pickupOrder('2026-11-02', '8:00 PM')->assertSessionHasErrors('pickup_time');

        // A basket with both kinds is held to the stricter rule.
        $quick = Product::query()->where('name', 'Quick Bite')->first();
        $slow = Product::query()->where('name', 'Made To Order')->first();
        $this->post('/orders', [
            'customer_name' => 'Pat', 'customer_email' => 'pat@example.com', 'customer_phone' => '555-0100',
            'collection_method' => 'pickup', 'pickup_date' => '2026-11-02', 'pickup_time' => '8:00 PM',
            'payment_method' => 'cash_on_delivery',
            'items' => [['product_id' => $quick->id, 'quantity' => 1], ['product_id' => $slow->id, 'quantity' => 1]],
        ])->assertSessionHasErrors('pickup_time');
        $this->assertSame(1, Order::query()->count());
    }

    public function test_searchable_products_tell_the_checkout_which_items_skip_the_lead_time(): void
    {
        Product::query()->forceCreate(['name' => 'Quick Bite', 'price' => 5, 'category' => 'Snacks', 'is_active' => true, 'available_for_pickup' => true]);
        Product::query()->forceCreate(['name' => 'Made To Order', 'price' => 50, 'category' => 'Trays', 'is_active' => true, 'available_for_pickup' => false]);

        $this->get('/checkout')->assertInertia(fn ($page) => $page
            ->where('searchProducts.1.available_for_pickup', true)
            ->where('searchProducts.0.available_for_pickup', false));
    }
}
