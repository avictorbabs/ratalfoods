<?php

namespace App\Support;

use App\Models\Product;

class CartLines
{
    /**
     * Turn [{product_id, quantity}] into cart lines using current product data.
     * Products that are gone or inactive are reported instead of returned.
     *
     * @param  array<int, array{product_id: int|string, quantity: int|string}>  $items
     * @return array{lines: list<array<string, mixed>>, unavailable: list<string>}
     */
    public static function resolve(array $items): array
    {
        $ids = collect($items)->pluck('product_id')->map(fn ($id) => (int) $id)->unique();
        $products = Product::query()->whereIn('id', $ids)->get()->keyBy('id');

        $lines = [];
        $unavailable = [];

        foreach ($items as $item) {
            $product = $products->get((int) $item['product_id']);

            if (! $product || ! $product->is_active) {
                $unavailable[] = $product?->name ?? 'An item';

                continue;
            }

            $lines[] = [
                'line_id' => $product->id.':default',
                'product_id' => $product->id,
                'product_name' => $product->name,
                'price' => $product->effectivePrice(),
                'image_url' => $product->image_url,
                'quantity' => max(1, min(99, (int) $item['quantity'])),
                'variant_label' => null,
            ];
        }

        return ['lines' => $lines, 'unavailable' => $unavailable];
    }
}
