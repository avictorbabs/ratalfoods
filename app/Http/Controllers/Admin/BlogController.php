<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use App\Support\PublicMediaUrl;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class BlogController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $status = (string) $request->query('status', '');

        $posts = BlogPost::query()
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('title', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%")
                        ->orWhere('excerpt', 'like', "%{$search}%")
                        ->orWhere('content', 'like', "%{$search}%");
                });
            })
            ->when($status === 'published', fn ($query) => $query->where('is_published', true))
            ->when($status === 'draft', fn ($query) => $query->where('is_published', false))
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/Blogs/Index', [
            'posts' => $posts,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/Blogs/Form', [
            'post' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validatePayload($request);
        $payload = $this->buildPayload($request, $validated);

        BlogPost::query()->create($payload);

        return redirect()
            ->route('admin.blogs.index')
            ->with('success', 'Blog post created successfully.');
    }

    public function edit(BlogPost $blog): Response
    {
        return Inertia::render('admin/Blogs/Form', [
            'post' => $blog,
        ]);
    }

    public function update(Request $request, BlogPost $blog): RedirectResponse
    {
        $validated = $this->validatePayload($request, $blog->id);
        $payload = $this->buildPayload($request, $validated, $blog);

        $blog->update($payload);

        return redirect()
            ->route('admin.blogs.index')
            ->with('success', 'Blog post updated successfully.');
    }

    public function destroy(BlogPost $blog): RedirectResponse
    {
        $title = $blog->title;
        $blog->delete();

        return redirect()
            ->route('admin.blogs.index')
            ->with('success', "\"{$title}\" was deleted.");
    }

    /**
     * @return array<string, mixed>
     */
    private function validatePayload(Request $request, ?int $postId = null): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:blog_posts,slug,'.($postId ?? 'NULL').',id'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'content' => ['required', 'string'],
            'published_at' => ['nullable', 'date'],
            'is_published' => ['sometimes', 'boolean'],
            'image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
            'media_files' => ['nullable', 'array'],
            'media_files.*' => ['file', 'mimes:jpg,jpeg,png,webp,gif,mp4,webm,mov', 'max:20480'],
        ]);
    }

    /**
     * @param array<string, mixed> $validated
     * @return array<string, mixed>
     */
    private function buildPayload(Request $request, array $validated, ?BlogPost $blog = null): array
    {
        $title = (string) $validated['title'];
        $slug = trim((string) ($validated['slug'] ?? ''));
        $baseSlug = $slug !== '' ? Str::slug($slug) : Str::slug($title);
        $resolvedSlug = $this->ensureUniqueSlug($baseSlug, $blog?->id);

        $imageUrl = $blog?->image_url;
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            if ($file instanceof UploadedFile) {
                $imageUrl = $file->store('blog', 'public');
            }
        }

        $content = (string) $validated['content'];
        $mediaHtml = $this->mediaHtmlFromUploads($request);
        if ($mediaHtml !== '') {
            $content = trim($content)."\n\n".$mediaHtml;
        }

        $excerpt = trim((string) ($validated['excerpt'] ?? ''));
        if ($excerpt === '') {
            $plain = trim(strip_tags($content));
            $excerpt = Str::limit($plain, 180, '…');
        }

        return [
            'title' => $title,
            'slug' => $resolvedSlug,
            'excerpt' => $excerpt,
            'content' => $content,
            'image_url' => $imageUrl,
            'published_at' => $validated['published_at'] ?? null,
            'is_published' => (bool) ($validated['is_published'] ?? false),
        ];
    }

    private function ensureUniqueSlug(string $baseSlug, ?int $ignoreId = null): string
    {
        $slug = $baseSlug !== '' ? $baseSlug : 'post';
        $counter = 2;

        while (
            BlogPost::query()
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = $baseSlug.'-'.$counter;
            $counter++;
        }

        return $slug;
    }

    private function mediaHtmlFromUploads(Request $request): string
    {
        if (! $request->hasFile('media_files')) {
            return '';
        }

        $chunks = [];

        foreach ($request->file('media_files', []) as $file) {
            if (! $file instanceof UploadedFile) {
                continue;
            }

            $path = $file->store('blog/content', 'public');
            $url = PublicMediaUrl::resolve($path) ?? $path;
            $mime = $file->getMimeType() ?? '';

            if (str_starts_with($mime, 'video/')) {
                $chunks[] = '<p><video controls preload="metadata" style="max-width:100%;height:auto;" src="'.e($url).'"></video></p>';
                continue;
            }

            $chunks[] = '<p><img src="'.e($url).'" alt="" style="max-width:100%;height:auto;" /></p>';
        }

        return implode("\n", $chunks);
    }
}
