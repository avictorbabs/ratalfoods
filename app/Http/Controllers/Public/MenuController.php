<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\PageContent;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MenuController extends Controller
{
    public function index(Request $request): Response
    {
        $products = Product::query()
            ->where('is_active', true)
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        $categories = Category::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->pluck('name')
            ->prepend('All')
            ->values();

        return Inertia::render('public/Menu', [
            'products' => $products,
            'categories' => $categories,
            'filters' => [
                'category' => $request->string('category')->trim()->toString(),
            ],
            'pageContent' => PageContent::resolved('menu'),
        ]);
    }

    public function show(Product $product): Response
    {
        abort_unless($product->is_active, 404);

        $reviews = $product->reviews()
            ->where('is_approved', true)
            ->latest()
            ->get();

        return Inertia::render('public/ProductDetail', [
            'product' => $product,
            'reviews' => $reviews,
            'reviewStats' => [
                'count' => $reviews->count(),
                'average' => $reviews->isNotEmpty() ? round($reviews->avg('rating'), 1) : null,
            ],
        ]);
    }
}
