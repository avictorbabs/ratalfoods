<?php

namespace Tests\Feature;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductGalleryTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_product_with_gallery_items_can_be_saved_and_updated(): void
    {
        $gallery = [['type' => 'image', 'url' => 'products/gallery/a.jpg'], ['type' => 'image', 'url' => 'products/gallery/b.jpg']];

        $product = Product::query()->create(['name' => 'Tray', 'price' => 160, 'category' => 'Food Trays', 'gallery' => $gallery]);
        $product->update(['price' => 170, 'gallery' => $gallery]);

        $fresh = $product->fresh();
        $this->assertSame('170.00', $fresh->price);
        $this->assertCount(2, $fresh->gallery);
        $this->assertSame('image', $fresh->gallery[0]['type']);
    }

    public function test_an_empty_or_missing_gallery_still_works(): void
    {
        $product = Product::query()->create(['name' => 'Tray', 'price' => 10, 'category' => 'Food Trays', 'gallery' => []]);
        $this->assertSame([], $product->fresh()->gallery);
    }
}
