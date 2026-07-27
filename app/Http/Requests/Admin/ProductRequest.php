<?php

namespace App\Http\Requests\Admin;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->isAdmin();
    }

    protected function prepareForValidation(): void
    {
        foreach (['variations', 'tags', 'existing_gallery'] as $field) {
            $value = $this->input($field);

            if (is_string($value)) {
                $decoded = json_decode($value, true);
                $this->merge([$field => is_array($decoded) ? $decoded : []]);
            }
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'sale_price' => ['nullable', 'numeric', 'min:0'],
            'sale_starts_at' => ['nullable', 'date'],
            'sale_ends_at' => ['nullable', 'date', 'after_or_equal:sale_starts_at'],
            'category_id' => ['required', 'integer', Rule::exists('categories', 'id')],
            'product_image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
            'gallery_files' => ['nullable', 'array'],
            'gallery_files.*' => ['file', 'mimes:jpg,jpeg,png,webp,gif,mp4,webm,mov', 'max:20480'],
            'existing_gallery' => ['nullable', 'array'],
            'existing_gallery.*.type' => ['required_with:existing_gallery', 'in:image,video'],
            'existing_gallery.*.url' => ['required_with:existing_gallery', 'string', 'max:2048'],
            'stock_quantity' => ['required', 'integer', 'min:0'],
            'is_featured' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'available_for_pickup' => ['sometimes', 'boolean'],
            'preparation_time' => ['nullable', 'string', 'max:255'],
            'serves' => ['nullable', 'string', 'max:255'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:100'],
            'variations' => ['nullable', 'array'],
            'variations.*.name' => ['required_with:variations', 'string', 'max:100'],
            'variations.*.options' => ['required_with:variations', 'array', 'min:1'],
            'variations.*.options.*.value' => ['required', 'string', 'max:100'],
            'variations.*.options.*.label' => ['required', 'string', 'max:100'],
            'variations.*.options.*.price_modifier' => ['required', 'numeric'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function productAttributes(string $imageUrl, array $gallery): array
    {
        $stockQuantity = (int) $this->validated('stock_quantity');
        $category = Category::query()->findOrFail($this->validated('category_id'));

        return [
            'name' => $this->validated('name'),
            'description' => $this->validated('description'),
            'price' => $this->validated('price'),
            'sale_price' => $this->validated('sale_price'),
            'sale_starts_at' => $this->validated('sale_starts_at'),
            'sale_ends_at' => $this->validated('sale_ends_at'),
            'category_id' => $category->id,
            'category' => $category->name,
            'image_url' => $imageUrl,
            'gallery' => $gallery,
            'stock_quantity' => $stockQuantity,
            'in_stock' => $stockQuantity > 0,
            'is_featured' => $this->boolean('is_featured'),
            'is_active' => $this->boolean('is_active', true),
            'available_for_pickup' => $this->boolean('available_for_pickup', true),
            'preparation_time' => $this->validated('preparation_time') ?? 'Ready in 2 Hours',
            'serves' => $this->validated('serves'),
            'tags' => array_values(array_filter($this->validated('tags') ?? [])),
            'variations' => $this->validated('variations') ?? [],
        ];
    }
}
