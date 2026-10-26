<?php

namespace App\Support;

use App\Models\Product;

/**
 * Works out what one unit of a dish costs once the customer's chosen variations
 * and add-ons are included. The browser only says WHAT was chosen; the price is
 * always calculated here from the product as it is now.
 */
class LinePricing
{
    /**
     * @param  array<string, mixed>  $variants  variation name => chosen option value
     * @param  array<int, array<string, mixed>>  $addons  list of {key, quantity}
     * @return array{unit_price: float, name: string, label: string, key: string, variants: list<array<string, mixed>>, addons: list<array<string, mixed>>}
     *
     * @throws LineOptionException
     */
    public static function resolve(Product $product, array $variants = [], array $addons = []): array
    {
        $unit = $product->effectivePrice();
        $variantRows = [];
        $labels = [];
        $keys = [];

        foreach ((array) $product->variations as $variation) {
            $name = trim((string) ($variation['name'] ?? ''));
            $options = array_values(array_filter(
                (array) ($variation['options'] ?? []),
                fn ($option) => trim((string) ($option['label'] ?? '')) !== '' && trim((string) ($option['value'] ?? '')) !== '',
            ));

            if ($name === '' || $options === []) {
                continue;
            }

            // No choice sent (older carts): the first option, which is also what the product page preselects.
            $wanted = isset($variants[$name]) ? (string) $variants[$name] : (string) $options[0]['value'];
            $option = collect($options)->first(fn ($candidate) => (string) $candidate['value'] === $wanted);

            if (! $option) {
                throw new LineOptionException("“{$product->name}”: the option you chose for {$name} is no longer available. Please choose it again.");
            }

            $modifier = (float) ($option['price_modifier'] ?? 0);
            $unit += $modifier;
            $labels[] = (string) $option['label'];
            $keys[] = "{$name}:{$option['value']}";
            $variantRows[] = ['name' => $name, 'value' => (string) $option['value'], 'label' => (string) $option['label'], 'price' => $modifier];
        }

        $available = collect((array) $product->addons)->keyBy(fn ($addon) => (string) ($addon['key'] ?? ''));
        $chosen = [];

        foreach ($addons as $entry) {
            $key = (string) ($entry['key'] ?? '');
            $quantity = (int) ($entry['quantity'] ?? 0);

            if ($quantity <= 0) {
                continue;
            }

            if (! $available->has($key)) {
                throw new LineOptionException("“{$product->name}”: an extra you chose is no longer available. Please check your cart.");
            }

            $chosen[$key] = ($chosen[$key] ?? 0) + $quantity;
        }

        $addonRows = [];
        ksort($chosen);

        foreach ($chosen as $key => $quantity) {
            $addon = $available->get($key);
            $max = (int) ($addon['max_qty'] ?? 0);

            if ($max > 0 && $quantity > $max) {
                throw new LineOptionException("“{$addon['name']}” can be added up to {$max} per dish.");
            }

            $price = max(0, (float) ($addon['price'] ?? 0));
            $unit += $price * $quantity;
            $labels[] = $addon['name'].($quantity > 1 ? " ×{$quantity}" : '');
            $keys[] = "+{$key}×{$quantity}";
            $addonRows[] = ['key' => $key, 'name' => (string) $addon['name'], 'quantity' => $quantity, 'price' => $price];
        }

        return [
            'unit_price' => round(max(0, $unit), 2),
            'name' => $product->name.($labels === [] ? '' : ' ('.implode(' · ', $labels).')'),
            'label' => implode(' · ', $labels),
            'key' => implode('|', $keys),
            'variants' => $variantRows,
            'addons' => $addonRows,
        ];
    }

    /**
     * Normalise raw request data into the shape stored with carts and schedules.
     *
     * @param  array<string, mixed>  $item
     * @return array{product_id: int, quantity: int, variants: array<string, string>, addons: list<array{key: string, quantity: int}>}
     */
    public static function normalizeItem(array $item): array
    {
        $variants = [];
        foreach ((array) ($item['variants'] ?? []) as $name => $value) {
            if (is_string($name) && (is_string($value) || is_numeric($value))) {
                $variants[$name] = (string) $value;
            }
        }

        $addons = [];
        foreach ((array) ($item['addons'] ?? []) as $entry) {
            if (is_array($entry) && isset($entry['key'])) {
                $addons[] = ['key' => (string) $entry['key'], 'quantity' => max(0, min(99, (int) ($entry['quantity'] ?? 0)))];
            }
        }

        return [
            'product_id' => (int) ($item['product_id'] ?? 0),
            'quantity' => max(1, min(99, (int) ($item['quantity'] ?? 1))),
            'variants' => $variants,
            'addons' => $addons,
        ];
    }
}
