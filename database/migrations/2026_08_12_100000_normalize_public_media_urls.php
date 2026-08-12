<?php

use App\Models\BlogPost;
use App\Models\Category;
use App\Models\GalleryItem;
use App\Models\Product;
use App\Support\PublicMediaUrl;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Product::query()->eachById(function (Product $product): void {
            $updates = [];

            $rawImage = $product->getRawOriginal('image_url');
            if (is_string($rawImage) && $rawImage !== '') {
                $updates['image_url'] = PublicMediaUrl::normalizeForStorage($rawImage);
            }

            $rawGallery = $product->getRawOriginal('gallery');
            if (is_string($rawGallery) && $rawGallery !== '') {
                $decoded = json_decode($rawGallery, true);
                if (is_array($decoded)) {
                    $updates['gallery'] = PublicMediaUrl::normalizeGalleryForStorage($decoded);
                }
            }

            if ($updates !== []) {
                $product->forceFill($updates)->saveQuietly();
            }
        });

        Category::query()->eachById(function (Category $category): void {
            $rawImage = $category->getRawOriginal('image_url');
            if (! is_string($rawImage) || $rawImage === '') {
                return;
            }

            $category->forceFill([
                'image_url' => PublicMediaUrl::normalizeForStorage($rawImage),
            ])->saveQuietly();
        });

        BlogPost::query()->eachById(function (BlogPost $post): void {
            $rawImage = $post->getRawOriginal('image_url');
            if (! is_string($rawImage) || $rawImage === '') {
                return;
            }

            $post->forceFill([
                'image_url' => PublicMediaUrl::normalizeForStorage($rawImage),
            ])->saveQuietly();
        });

        GalleryItem::query()->eachById(function (GalleryItem $item): void {
            $rawMedia = $item->getRawOriginal('media_url');
            if (! is_string($rawMedia) || $rawMedia === '') {
                return;
            }

            $item->forceFill([
                'media_url' => PublicMediaUrl::normalizeForStorage($rawMedia),
            ])->saveQuietly();
        });
    }

    public function down(): void
    {
        // Stored paths remain valid; no rollback needed.
    }
};
