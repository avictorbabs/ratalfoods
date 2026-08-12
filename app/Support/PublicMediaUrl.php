<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PublicMediaUrl
{
    /**
     * @var list<string>
     */
    private const IMAGE_KEYS = [
        'image',
        'hero_image',
        'story_image',
        'culture_image',
        'board_left_top',
        'board_left_bottom',
        'board_right',
        'showcase_1',
        'showcase_2',
        'logo',
    ];

    /**
     * Build a public URL from a stored value using the current APP_URL / public disk.
     */
    public static function resolve(?string $stored): ?string
    {
        if ($stored === null || trim($stored) === '') {
            return null;
        }

        $stored = trim($stored);

        if (Str::startsWith($stored, ['http://', 'https://'])) {
            $path = self::extractStoragePath($stored);

            if ($path !== null) {
                return Storage::disk('public')->url($path);
            }

            return $stored;
        }

        if (Str::startsWith($stored, '/')) {
            return url($stored);
        }

        return Storage::disk('public')->url($stored);
    }

    /**
     * Persist only disk-relative paths or external CDN URLs — never APP_URL-prefixed storage URLs.
     */
    public static function normalizeForStorage(?string $value): ?string
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        $value = trim($value);

        if (Str::startsWith($value, ['http://', 'https://'])) {
            $path = self::extractStoragePath($value);

            if ($path !== null) {
                return $path;
            }

            return $value;
        }

        if (Str::startsWith($value, '/storage/')) {
            return ltrim(Str::after($value, '/storage/'), '/');
        }

        if (Str::startsWith($value, '/')) {
            return $value;
        }

        return ltrim($value, '/');
    }

    /**
     * @param  array<int, array<string, mixed>>|null  $gallery
     * @return array<int, array<string, mixed>>|null
     */
    public static function resolveGallery(?array $gallery): ?array
    {
        if ($gallery === null) {
            return null;
        }

        return array_map(function (array $item): array {
            if (isset($item['url']) && is_string($item['url'])) {
                $item['url'] = self::resolve($item['url']) ?? $item['url'];
            }

            return $item;
        }, $gallery);
    }

    /**
     * @param  array<int, array<string, mixed>>|null  $gallery
     * @return array<int, array<string, mixed>>|null
     */
    public static function normalizeGalleryForStorage(?array $gallery): ?array
    {
        if ($gallery === null) {
            return null;
        }

        return array_map(function (array $item): array {
            if (isset($item['url']) && is_string($item['url'])) {
                $item['url'] = self::normalizeForStorage($item['url']) ?? $item['url'];
            }

            return $item;
        }, $gallery);
    }

    /**
     * Recursively resolve image-like string fields using APP_URL / public disk.
     *
     * @param  array<string, mixed>  $tree
     * @return array<string, mixed>
     */
    public static function resolveTree(array $tree): array
    {
        return self::walkImageKeys($tree, fn (string $value): string => self::resolve($value) ?? $value);
    }

    /**
     * Recursively persist image-like fields as disk-relative paths or external URLs.
     *
     * @param  array<string, mixed>  $tree
     * @return array<string, mixed>
     */
    public static function normalizeTree(array $tree): array
    {
        return self::walkImageKeys($tree, fn (string $value): string => self::normalizeForStorage($value) ?? $value);
    }

    /**
     * @param  array<string, mixed>  $tree
     * @param  callable(string): string  $transform
     * @return array<string, mixed>
     */
    private static function walkImageKeys(array $tree, callable $transform): array
    {
        foreach ($tree as $key => $value) {
            if (is_array($value)) {
                $tree[$key] = self::walkImageKeys($value, $transform);
                continue;
            }

            if (is_string($value) && in_array($key, self::IMAGE_KEYS, true)) {
                $tree[$key] = $transform($value);
            }
        }

        return $tree;
    }

    private static function extractStoragePath(string $url): ?string
    {
        $path = parse_url($url, PHP_URL_PATH);

        if (! is_string($path) || ! Str::contains($path, '/storage/')) {
            return null;
        }

        return ltrim(Str::after($path, '/storage/'), '/');
    }
}
