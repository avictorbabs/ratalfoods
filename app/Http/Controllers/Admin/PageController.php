<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PageRequest;
use App\Models\PageContent;
use App\Support\PageContentDefaults;
use App\Support\PublicMediaUrl;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    public function edit(string $page): Response
    {
        $slug = $this->assertSlug($page);

        return Inertia::render('admin/Pages/Edit', [
            'slug' => $slug,
            'label' => PageContentDefaults::label($slug),
            'pageContent' => PageContent::resolved($slug),
        ]);
    }

    public function update(PageRequest $request, string $page): RedirectResponse
    {
        $slug = $this->assertSlug($page);
        $defaults = PageContentDefaults::for($slug);
        $submitted = $request->input('content', []);
        $content = PageContentDefaults::merge(
            $defaults,
            is_array($submitted) ? $submitted : [],
        );
        $content = $this->applyUploads($request, $slug, $content);
        $content = PublicMediaUrl::normalizeTree($content);

        $record = PageContent::query()->firstOrCreate(
            ['slug' => $slug],
            ['content' => $defaults],
        );
        $record->update(['content' => $content]);

        return redirect()
            ->route('admin.pages.edit', $slug)
            ->with('success', PageContentDefaults::label($slug).' page updated.');
    }

    private function assertSlug(string $page): string
    {
        abort_unless(in_array($page, PageContentDefaults::slugs(), true), 404);

        return $page;
    }

    /**
     * @param  array<string, mixed>  $content
     * @return array<string, mixed>
     */
    private function applyUploads(PageRequest $request, string $slug, array $content): array
    {
        foreach ($this->uploadMap($slug) as $field => $path) {
            $file = $request->file($field);

            if (! $file instanceof UploadedFile) {
                continue;
            }

            $stored = $file->store("pages/{$slug}", 'public');
            $content = $this->setNested($content, $path, $stored);
        }

        return $content;
    }

    /**
     * @return array<string, list<int|string>>
     */
    private function uploadMap(string $slug): array
    {
        return match ($slug) {
            'home' => [
                'hero_image' => ['hero', 'image'],
                'why_slide_0_image' => ['why', 'slides', 0, 'image'],
                'why_slide_1_image' => ['why', 'slides', 1, 'image'],
                'why_slide_2_image' => ['why', 'slides', 2, 'image'],
            ],
            'about' => [
                'hero_image' => ['hero', 'image'],
                'story_image' => ['story', 'image'],
                'culture_image' => ['culture', 'image'],
            ],
            'contact', 'booking' => [
                'hero_image' => ['hero', 'image'],
            ],
            'menu' => [
                'hero_image' => ['hero', 'image'],
                'board_left_top' => ['board_left_top'],
                'board_left_bottom' => ['board_left_bottom'],
                'board_right' => ['board_right'],
            ],
            'gallery' => [
                'hero_image' => ['hero', 'image'],
                'showcase_1' => ['showcase_1'],
                'showcase_2' => ['showcase_2'],
            ],
            'footer' => [
                'footer_logo' => ['logo'],
            ],
            default => [],
        };
    }

    /**
     * @param  array<string, mixed>  $array
     * @param  list<int|string>  $path
     * @return array<string, mixed>
     */
    private function setNested(array $array, array $path, mixed $value): array
    {
        $ref = &$array;
        $last = array_pop($path);

        foreach ($path as $key) {
            if (! isset($ref[$key]) || ! is_array($ref[$key])) {
                $ref[$key] = [];
            }

            $ref = &$ref[$key];
        }

        $ref[$last] = $value;

        return $array;
    }
}
