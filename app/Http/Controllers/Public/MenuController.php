<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Category;
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
        ]);
    }

    public function show(Product $product): Response
    {
        abort_unless($product->is_active, 404);

        return Inertia::render('public/ProductDetail', [
            'product' => $product,
        ]);
    }
}
