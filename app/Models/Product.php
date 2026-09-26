<?php

namespace App\Models;

use App\Support\PublicMediaUrl;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'name',
        'description',
        'price',
        'sale_price',
        'sale_starts_at',
        'sale_ends_at',
        'category',
        'category_id',
        'image_url',
        'gallery',
        'available_for_pickup',
        'is_featured',
        'preparation_time',
        'serves',
        'is_active',
        'in_stock',
        'stock_quantity',
        'variations',
        'tags',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'sale_price' => 'decimal:2',
            'sale_starts_at' => 'datetime',
            'sale_ends_at' => 'datetime',
            'available_for_pickup' => 'boolean',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'in_stock' => 'boolean',
            'stock_quantity' => 'integer',
            'variations' => 'array',
            'tags' => 'array',
        ];
    }

    protected function imageUrl(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => PublicMediaUrl::resolve($value),
            set: fn (?string $value) => PublicMediaUrl::normalizeForStorage($value),
        );
    }

    protected function gallery(): Attribute
    {
        return Attribute::make(
            get: function ($value) {
                if ($value === null) {
                    return null;
                }

                $decoded = is_array($value) ? $value : json_decode((string) $value, true);

                return PublicMediaUrl::resolveGallery(is_array($decoded) ? $decoded : null);
            },
            set: fn (?array $value) => PublicMediaUrl::normalizeGalleryForStorage($value),
        );
    }

    public function productCategory(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(ProductReview::class);
    }

    public function isSaleActive(?\DateTimeInterface $at = null): bool
    {
        $at ??= now();

        if ($this->sale_price === null || (float) $this->sale_price <= 0) {
            return false;
        }

        if ((float) $this->sale_price >= (float) $this->price) {
            return false;
        }

        if ($this->sale_starts_at && $at < $this->sale_starts_at) {
            return false;
        }

        if ($this->sale_ends_at && $at > $this->sale_ends_at) {
            return false;
        }

        return true;
    }

    public function effectivePrice(?\DateTimeInterface $at = null): float
    {
        if ($this->isSaleActive($at)) {
            return (float) $this->sale_price;
        }

        return (float) $this->price;
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
