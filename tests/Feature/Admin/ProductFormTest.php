<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProductFormTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => UserRole::Admin]);
    }

    private function payload(array $overrides = []): array
    {
        $category = Category::query()->forceCreate(['name' => 'Mains', 'slug' => 'mains']);

        return [
            'name' => 'Jollof Rice',
            'description' => 'Smoky party jollof rice.',
            'price' => 19.99,
            'category_id' => $category->id,
            'stock_quantity' => 10,
            ...$overrides,
        ];
    }

    public function test_creating_a_product_without_an_image_fails_validation()
    {
        $response = $this->actingAs($this->admin())
            ->post('/admin/products', $this->payload());

        $response->assertSessionHasErrors('product_image');
        $this->assertDatabaseCount('products', 0);
    }

    public function test_creating_a_product_with_an_image_succeeds()
    {
        Storage::fake('public');

        $response = $this->actingAs($this->admin())
            ->post('/admin/products', $this->payload([
                'product_image' => UploadedFile::fake()->image('dish.jpg'),
            ]));

        $response->assertRedirect(route('admin.products.index'));
        $this->assertDatabaseCount('products', 1);
        $this->assertNotNull(Product::query()->sole()->image_url);
    }

    public function test_updating_a_product_that_already_has_an_image_does_not_require_a_new_one()
    {
        Storage::fake('public');

        $product = Product::query()->forceCreate([
            'name' => 'Egusi Soup',
            'price' => 22.00,
            'category' => 'Mains',
            'image_url' => 'products/existing.jpg',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->admin())
            ->put("/admin/products/{$product->id}", $this->payload(['name' => 'Egusi Soup Updated']));

        $response->assertRedirect(route('admin.products.index'));
        $this->assertSame('Egusi Soup Updated', $product->fresh()->name);
        $this->assertSame('products/existing.jpg', $product->fresh()->getRawOriginal('image_url'));
    }

    public function test_updating_a_product_that_has_no_image_still_requires_one()
    {
        $product = Product::query()->forceCreate([
            'name' => 'No Image Dish',
            'price' => 15.00,
            'category' => 'Mains',
            'image_url' => null,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->admin())
            ->put("/admin/products/{$product->id}", $this->payload());

        $response->assertSessionHasErrors('product_image');
    }

    public function test_creating_a_product_without_a_description_fails_validation()
    {
        $payload = $this->payload([
            'product_image' => UploadedFile::fake()->image('dish.jpg'),
        ]);
        unset($payload['description']);

        Storage::fake('public');

        $response = $this->actingAs($this->admin())->post('/admin/products', $payload);

        $response->assertSessionHasErrors('description');
        $this->assertDatabaseCount('products', 0);
    }

    public function test_an_incomplete_attribute_row_fails_validation()
    {
        Storage::fake('public');

        $response = $this->actingAs($this->admin())->post('/admin/products', $this->payload([
            'product_image' => UploadedFile::fake()->image('dish.jpg'),
            'variations' => json_encode([
                ['name' => 'Size', 'options' => [['value' => '', 'label' => '', 'price_modifier' => 0]]],
            ]),
        ]));

        $response->assertSessionHasErrors(['variations.0.options.0.label']);
    }
}
