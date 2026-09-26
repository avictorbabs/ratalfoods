<?php

namespace App\Http\Requests\Admin;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->isAdmin();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $category = $this->route('category');
        $hasExistingImage = $category instanceof Category && filled($category->image_url);

        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('categories', 'slug')->ignore($category?->id),
            ],
            'description' => ['nullable', 'string', 'max:10000'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'category_image' => [
                $hasExistingImage ? 'nullable' : 'required',
                'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120',
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'category_image.required' => 'Please upload a thumbnail image.',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function categoryAttributes(?string $imageUrl): array
    {
        return [
            'name' => $this->validated('name'),
            'slug' => $this->validated('slug'),
            'description' => $this->validated('description'),
            'image_url' => $imageUrl,
            'sort_order' => (int) ($this->validated('sort_order') ?? 0),
        ];
    }
}
