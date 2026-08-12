<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProductRequest;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $category = $request->query('category');
        $stock = $request->query('stock');

        $categoryNames = Category::query()->pluck('name')->all();

        $products = Product::query()
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%");
                });
            })
            ->when(
                is_string($category) && $category !== '' && in_array($category, $categoryNames, true),
                fn ($query) => $query->where('category', $category),
            )
            ->when($stock === 'in_stock', fn ($query) => $query->where('in_stock', true)->where('stock_quantity', '>', 0))
            ->when($stock === 'out_of_stock', fn ($query) => $query->where(function ($q): void {
                $q->where('in_stock', false)->orWhere('stock_quantity', 0);
            }))
            ->when($stock === 'inactive', fn ($query) => $query->where('is_active', false))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/Products/Index', [
            'products' => $products,
            'filters' => [
                'search' => $search,
                'category' => is_string($category) ? $category : '',
                'stock' => is_string($stock) ? $stock : '',
            ],
            'categoryOptions' => $this->categoryFilterOptions(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/Products/Form', [
            'product' => null,
            'categoryOptions' => $this->categoryFormOptions(),
        ]);
    }

    public function store(ProductRequest $request): RedirectResponse
    {
        [$imageUrl, $gallery] = $this->resolveMedia($request);

        Product::query()->create($request->productAttributes($imageUrl, $gallery));

        return redirect()
            ->route('admin.products.index')
            ->with('success', 'Product created successfully.');
    }

    public function edit(Product $product): Response
    {
        return Inertia::render('admin/Products/Form', [
            'product' => $product,
            'categoryOptions' => $this->categoryFormOptions(),
        ]);
    }

    public function update(ProductRequest $request, Product $product): RedirectResponse
    {
        [$imageUrl, $gallery] = $this->resolveMedia($request, $product);

        $product->update($request->productAttributes($imageUrl, $gallery));

        return redirect()
            ->route('admin.products.index')
            ->with('success', 'Product updated successfully.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $name = $product->name;
        $product->delete();

        return redirect()
            ->route('admin.products.index')
            ->with('success', "\"{$name}\" was deleted.");
    }

    public function duplicate(Product $product): RedirectResponse
    {
        $copy = $product->replicate();
        $copy->name = $this->duplicateName($product->name);
        $copy->save();

        return redirect()
            ->route('admin.products.edit', $copy)
            ->with('success', 'Product duplicated. Review and save the copy.');
    }

    /**
     * @return array{0: ?string, 1: array<int, array{type: string, url: string}>}
     */
    private function resolveMedia(ProductRequest $request, ?Product $product = null): array
    {
        $imageUrl = $product?->image_url;

        if ($request->hasFile('product_image')) {
            $imageUrl = $this->storePublicFile($request->file('product_image'), 'products');
        }

        $gallery = $request->input('existing_gallery', []);

        if (! is_array($gallery)) {
            $gallery = [];
        }

        if ($request->hasFile('gallery_files')) {
            foreach ($request->file('gallery_files') as $file) {
                if (! $file instanceof UploadedFile) {
                    continue;
                }

                $url = $this->storePublicFile($file, 'products/gallery');
                $mime = $file->getMimeType() ?? '';
                $type = str_starts_with($mime, 'video/') ? 'video' : 'image';

                $gallery[] = [
                    'type' => $type,
                    'url' => $url,
                ];
            }
        }

        return [$imageUrl, array_values($gallery)];
    }

    private function storePublicFile(UploadedFile $file, string $directory): string
    {
        return $file->store($directory, 'public');
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    private function categoryFilterOptions(): array
    {
        return Category::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (Category $category) => [
                'value' => $category->name,
                'label' => $category->name,
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    private function categoryFormOptions(): array
    {
        return Category::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (Category $category) => [
                'value' => (string) $category->id,
                'label' => $category->name,
            ])
            ->values()
            ->all();
    }

    private function duplicateName(string $name): string
    {
        $base = preg_replace('/\s+\(Copy(?: \d+)?\)$/', '', $name) ?? $name;
        $candidate = "{$base} (Copy)";
        $counter = 2;

        while (Product::query()->where('name', $candidate)->exists()) {
            $candidate = "{$base} (Copy {$counter})";
            $counter++;
        }

        return $candidate;
    }
}
