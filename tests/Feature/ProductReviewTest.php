<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductReview;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductReviewTest extends TestCase
{
    use RefreshDatabase;

    private function product(): Product
    {
        return Product::query()->forceCreate([
            'name' => 'Jollof Rice',
            'price' => 19.99,
            'category' => 'Mains',
            'is_active' => true,
        ]);
    }

    public function test_a_guest_can_submit_a_review()
    {
        $product = $this->product();

        $response = $this->post("/menu/{$product->id}/reviews", [
            'customer_name' => 'Ada',
            'customer_email' => 'ada@example.com',
            'rating' => 5,
            'comment' => 'Absolutely delicious, best jollof in Windsor!',
        ]);

        $response->assertRedirect(route('menu.show', $product));
        $this->assertDatabaseHas('product_reviews', [
            'product_id' => $product->id,
            'customer_name' => 'Ada',
            'rating' => 5,
            'is_approved' => 1,
        ]);
    }

    public function test_a_review_requires_a_name_rating_and_comment()
    {
        $product = $this->product();

        $response = $this->post("/menu/{$product->id}/reviews", []);

        $response->assertSessionHasErrors(['customer_name', 'rating', 'comment']);
        $this->assertDatabaseCount('product_reviews', 0);
    }

    public function test_rating_must_be_between_one_and_five()
    {
        $product = $this->product();

        $response = $this->post("/menu/{$product->id}/reviews", [
            'customer_name' => 'Ada',
            'rating' => 6,
            'comment' => 'Great!',
        ]);

        $response->assertSessionHasErrors('rating');
    }

    public function test_the_product_page_shows_approved_reviews_and_stats()
    {
        $product = $this->product();

        ProductReview::query()->create([
            'product_id' => $product->id,
            'customer_name' => 'Ada',
            'rating' => 5,
            'comment' => 'Loved it!',
            'is_approved' => true,
        ]);

        ProductReview::query()->create([
            'product_id' => $product->id,
            'customer_name' => 'Bola',
            'rating' => 3,
            'comment' => 'It was okay.',
            'is_approved' => false,
        ]);

        $response = $this->get("/menu/{$product->id}");

        $response->assertInertia(fn ($page) => $page
            ->component('public/ProductDetail')
            ->has('reviews', 1)
            ->where('reviews.0.customer_name', 'Ada')
            ->where('reviewStats.count', 1)
            ->where('reviewStats.average', 5)
        );
    }
}
