<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ProductAddonsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
        config(['mail.order_notifications' => ['owner@example.com']]);
    }

    private function product(): Product
    {
        return Product::query()->forceCreate([
            'name' => 'Amala and Abula',
            'price' => 20,
            'category' => 'Mains',
            'is_active' => true,
            'variations' => [[
                'name' => 'Protein',
                'options' => [
                    ['value' => 'chicken', 'label' => 'Chicken', 'price_modifier' => 0],
                    ['value' => 'goat', 'label' => 'Goat', 'price_modifier' => 3],
                ],
            ]],
            'addons' => [
                ['key' => 'extra-wrap', 'name' => 'Extra wrap of amala', 'price' => 5, 'max_qty' => 3],
                ['key' => 'plantain', 'name' => 'Plantain', 'price' => 2.5, 'max_qty' => null],
            ],
        ]);
    }

    private function order(Product $product, array $item, int $quantity = 1)
    {
        return $this->post('/orders', [
            'customer_name' => 'Pat', 'customer_email' => 'pat@example.com', 'customer_phone' => '555-0100',
            'collection_method' => 'pickup', 'pickup_date' => now()->addDays(3)->toDateString(), 'pickup_time' => '4:00 PM',
            'payment_method' => 'cash_on_delivery',
            'items' => [['product_id' => $product->id, 'quantity' => $quantity, ...$item]],
        ]);
    }

    public function test_the_server_prices_the_variation_and_extras_and_records_the_choices(): void
    {
        $product = $this->product();

        $this->order($product, [
            'variants' => ['Protein' => 'goat'],
            'addons' => [['key' => 'extra-wrap', 'quantity' => 2], ['key' => 'plantain', 'quantity' => 1]],
        ], quantity: 2)->assertSessionHasNoErrors();

        $item = Order::query()->sole()->items->sole();

        // 20 + 3 (goat) + 2 x 5 (wraps) + 2.50 (plantain) = 35.50 each, two dishes.
        $this->assertSame('35.50', $item->price);
        $this->assertSame('71.00', Order::query()->sole()->subtotal);
        $this->assertSame('Amala and Abula (Goat · Extra wrap of amala ×2 · Plantain)', $item->product_name);
        $this->assertSame('goat', $item->options['variants'][0]['value']);
        $this->assertSame(2, $item->options['addons'][0]['quantity']);
    }

    public function test_a_price_sent_by_the_browser_is_ignored_and_no_choice_means_the_first_option(): void
    {
        $product = $this->product();

        $this->order($product, ['price' => 1, 'unit_price' => 1])->assertSessionHasNoErrors();

        $this->assertSame('20.00', Order::query()->sole()->items->sole()->price);
    }

    public function test_unknown_options_and_too_many_extras_are_refused_with_a_clear_message(): void
    {
        $product = $this->product();

        $this->order($product, ['variants' => ['Protein' => 'beef']])->assertSessionHasErrors('items');
        $this->order($product, ['addons' => [['key' => 'caviar', 'quantity' => 1]]])->assertSessionHasErrors('items');
        $this->order($product, ['addons' => [['key' => 'extra-wrap', 'quantity' => 4]]])->assertSessionHasErrors('items');

        $this->assertSame(0, Order::query()->count());
    }

    public function test_the_coupon_check_counts_the_extras(): void
    {
        $product = $this->product();
        Coupon::query()->create(['code' => 'SAVE10', 'type' => 'percent', 'value' => 10]);

        $this->postJson('/coupons/validate', [
            'code' => 'SAVE10',
            'items' => [['product_id' => $product->id, 'quantity' => 1, 'addons' => [['key' => 'extra-wrap', 'quantity' => 2]]]],
        ])->assertOk()->assertJson(['discount' => 3]);
    }

    public function test_reordering_keeps_the_same_options_at_todays_prices(): void
    {
        $user = User::factory()->create();
        $product = $this->product();

        $this->actingAs($user);
        $this->order($product, ['variants' => ['Protein' => 'goat'], 'addons' => [['key' => 'extra-wrap', 'quantity' => 1]]])->assertSessionHasNoErrors();
        $order = Order::query()->sole();
        $order->update(['user_id' => $user->id]);

        $addons = $product->addons;
        $addons[0]['price'] = 6;
        $product->update(['addons' => $addons]);

        $this->getJson("/dashboard/orders/{$order->id}/reorder")
            ->assertOk()
            ->assertJsonPath('items.0.price', 29)
            ->assertJsonPath('items.0.variants.Protein', 'goat')
            ->assertJsonPath('items.0.addons.0.key', 'extra-wrap');

        // An extra that has since been removed drops the line with a note instead of breaking.
        $product->update(['addons' => []]);
        $this->getJson("/dashboard/orders/{$order->id}/reorder")->assertOk()->assertJsonPath('items', [])->assertJsonCount(1, 'unavailable');
    }

    public function test_admin_can_save_extras_with_stable_keys(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $category = Category::query()->forceCreate(['name' => 'Mains', 'slug' => 'mains']);
        $product = $this->product();

        $payload = [
            'name' => 'Amala and Abula', 'description' => 'Soft.', 'price' => 20, 'category_id' => $category->id,
            'stock_quantity' => 10, 'product_image_url' => url('/storage/products/a.jpg'),
            'addons' => json_encode([
                ['key' => 'extra-wrap', 'name' => 'Big extra wrap', 'price' => 6, 'max_qty' => 3],
                ['name' => 'Extra wrap', 'price' => 4, 'max_qty' => ''],
                ['name' => 'Extra wrap', 'price' => 4, 'max_qty' => ''],
            ]),
        ];

        $this->actingAs($admin)->put("/admin/products/{$product->id}", $payload)->assertSessionHasNoErrors();

        $addons = $product->fresh()->addons;
        $this->assertSame(['extra-wrap', 'extra-wrap-2', 'extra-wrap-3'], array_column($addons, 'key'));
        $this->assertSame('Big extra wrap', $addons[0]['name']);
        $this->assertNull($addons[1]['max_qty']);

        $this->put("/admin/products/{$product->id}", [...$payload, 'addons' => json_encode([['name' => 'Bad', 'price' => -1]])])
            ->assertSessionHasErrors('addons.0.price');
    }
}
