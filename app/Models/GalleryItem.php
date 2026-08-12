<?php

namespace App\Models;

use App\Support\PublicMediaUrl;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class GalleryItem extends Model
{
    protected $fillable = [
        'title',
        'description',
        'media_type',
        'media_url',
        'sort_order',
        'is_featured',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    protected function mediaUrl(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => PublicMediaUrl::resolve($value),
            set: fn (?string $value) => PublicMediaUrl::normalizeForStorage($value),
        );
    }
}
