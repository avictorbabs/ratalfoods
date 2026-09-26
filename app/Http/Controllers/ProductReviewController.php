<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductReviewRequest;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;

class ProductReviewController extends Controller
{
    public function store(StoreProductReviewRequest $request, Product $product): RedirectResponse
    {
        $product->reviews()->create([
            'user_id' => $request->user()?->id,
            'customer_name' => $request->validated('customer_name'),
            'customer_email' => $request->validated('customer_email'),
            'rating' => $request->validated('rating'),
            'comment' => $request->validated('comment'),
        ]);

        return redirect()
            ->route('menu.show', $product)
            ->with('success', 'Thanks for your review!');
    }
}
