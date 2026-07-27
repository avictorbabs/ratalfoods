<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use App\Models\Category;
use App\Models\Product;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(): Response
    {
        $featuredProducts = Product::query()
            ->where('is_featured', true)
            ->where('is_active', true)
            ->orderBy('name')
            ->limit(8)
            ->get();

        $categories = Category::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(function (Category $category): array {
                $imageUrl = $category->image_url;

                if (! $imageUrl) {
                    $imageUrl = Product::query()
                        ->where('category_id', $category->id)
                        ->where('is_active', true)
                        ->whereNotNull('image_url')
                        ->orderByDesc('is_featured')
                        ->value('image_url');
                }

                return [
                    'name' => $category->name,
                    'image_url' => $imageUrl,
                ];
            })
            ->values();

        $latestPosts = BlogPost::query()
            ->published()
            ->orderByDesc('published_at')
            ->limit(4)
            ->get();

        return Inertia::render('public/Home', [
            'featuredProducts' => $featuredProducts,
            'categories' => $categories,
            'latestPosts' => $latestPosts,
        ]);
    }
}
