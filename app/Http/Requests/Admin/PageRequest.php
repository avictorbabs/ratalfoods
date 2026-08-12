<?php

namespace App\Http\Requests\Admin;

use App\Support\PageContentDefaults;
use Illuminate\Foundation\Http\FormRequest;

class PageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->isAdmin();
    }

    protected function prepareForValidation(): void
    {
        $content = $this->input('content');

        if (is_string($content)) {
            $decoded = json_decode($content, true);
            $this->merge(['content' => is_array($decoded) ? $decoded : []]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $image = ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'];

        return [
            'content' => ['required', 'array'],
            'hero_image' => $image,
            'story_image' => $image,
            'culture_image' => $image,
            'why_slide_0_image' => $image,
            'why_slide_1_image' => $image,
            'why_slide_2_image' => $image,
            'board_left_top' => $image,
            'board_left_bottom' => $image,
            'board_right' => $image,
            'showcase_1' => $image,
            'showcase_2' => $image,
            'footer_logo' => $image,
        ];
    }

    public function pageSlug(): string
    {
        $slug = (string) $this->route('page');

        abort_unless(in_array($slug, PageContentDefaults::slugs(), true), 404);

        return $slug;
    }
}
