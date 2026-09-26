<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GalleryItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Inertia\Inertia;
use Inertia\Response;

class GalleryController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        $items = GalleryItem::query()
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->orderBy('is_featured', 'desc')
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->paginate(24)
            ->withQueryString();

        return Inertia::render('admin/Gallery/Index', [
            'items' => $items,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_featured' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'media_file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,gif,mp4,webm,mov', 'max:20480'],
        ]);

        $file = $request->file('media_file');

        if (! $file instanceof UploadedFile) {
            return redirect()->route('admin.gallery.index')->with('error', 'Upload failed.');
        }

        $path = $file->store('gallery', 'public');
        $mime = $file->getMimeType() ?? '';
        $mediaType = str_starts_with($mime, 'video/') ? 'video' : 'image';

        GalleryItem::query()->create([
            'title' => $validated['title'] ?? null,
            'description' => $validated['description'] ?? null,
            'media_type' => $mediaType,
            'media_url' => $path,
            'sort_order' => (int) ($validated['sort_order'] ?? 0),
            'is_featured' => (bool) ($validated['is_featured'] ?? false),
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        return redirect()
            ->route('admin.gallery.index')
            ->with('success', 'Gallery media added.');
    }

    public function destroy(GalleryItem $galleryItem): RedirectResponse
    {
        $galleryItem->delete();

        return redirect()
            ->route('admin.gallery.index')
            ->with('success', 'Gallery media deleted.');
    }
}
