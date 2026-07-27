<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\GalleryItem;
use Inertia\Inertia;
use Inertia\Response;

class GalleryPageController extends Controller
{
    public function __invoke(): Response
    {
        $items = GalleryItem::query()
            ->where('is_active', true)
            ->orderBy('is_featured', 'desc')
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->get();

        return Inertia::render('public/Gallery', [
            'items' => $items,
        ]);
    }
}
