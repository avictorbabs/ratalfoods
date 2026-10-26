<?php

namespace App\Support;

use App\Models\Product;

class CartLines
{
    /**
     * Turn [{product_id, quantity, variants?, addons?}] into cart lines using current product data.
     * Products that are gone or inactive, or whose chosen options no longer exist, are reported
     * instead of returned.
     *
     * @param  array<int, array<string, mixed>>  $items
     * @return array{lines: list<array<string, mixed>>, unavailable: list<string>}
     */
    public static function resolve(array $items): array
    {
        $ids = collect($items)->pluck('product_id')->map(fn ($id) => (int) $id)->unique();
        $products = Product::query()->whereIn('id', $ids)->get()->keyBy('id');

        $lines = [];
        $unavailable = [];

        foreach ($items as $item) {
            $normalized = LinePricing::normalizeItem($item);
            $product = $products->get($normalized['product_id']);

            if (! $product || ! $product->is_active) {
                $unavailable[] = $product?->name ?? 'An item';

                continue;
            }

            try {
                $priced = LinePricing::resolve($product, $normalized['variants'], $normalized['addons']);
            } catch (LineOptionException) {
                $unavailable[] = $product->name;

                continue;
            }

            $lines[] = [
                'line_id' => $product->id.':'.($priced['key'] === '' ? 'default' : $priced['key']),
                'product_id' => $product->id,
                'product_name' => $priced['name'],
                'price' => $priced['unit_price'],
                'image_url' => $product->image_url,
                'quantity' => $normalized['quantity'],
                'variant_label' => $priced['label'] === '' ? null : $priced['label'],
                'variants' => $normalized['variants'],
                'addons' => array_values(array_filter($normalized['addons'], fn ($addon) => $addon['quantity'] > 0)),
                'options' => ['variants' => $priced['variants'], 'addons' => $priced['addons']],
            ];
        }

        return ['lines' => $lines, 'unavailable' => $unavailable];
    }
}
