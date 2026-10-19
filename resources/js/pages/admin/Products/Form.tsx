import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/layouts/dashboard-layout';
import type { ProductVariation } from '@/types/ratalfoods';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2, X } from 'lucide-react';
import { FormEvent, KeyboardEvent, useMemo, useState } from 'react';

type GalleryItem = {
    type: 'image' | 'video';
    url: string;
};

type ProductRecord = {
    id: number;
    name: string;
    description: string | null;
    price: string;
    sale_price: string | null;
    sale_starts_at: string | null;
    sale_ends_at: string | null;
    category: string;
    category_id: number | null;
    image_url: string | null;
    gallery: GalleryItem[] | null;
    stock_quantity: number;
    is_featured: boolean;
    is_active: boolean;
    available_for_pickup: boolean;
    preparation_time: string;
    serves: string | null;
    tags: string[] | null;
    variations: ProductVariation[] | null;
};

type ProductFormProps = {
    product: ProductRecord | null;
    categoryOptions: { value: string; label: string }[];
};

type FormData = {
    name: string;
    description: string;
    price: string;
    sale_price: string;
    sale_starts_at: string;
    sale_ends_at: string;
    category_id: string;
    product_image: File | null;
    product_image_url: string;
    gallery_files: File[];
    existing_gallery: GalleryItem[];
    stock_quantity: number;
    is_featured: boolean;
    is_active: boolean;
    available_for_pickup: boolean;
    preparation_time: string;
    serves: string;
    tags: string[];
    variations: ProductVariation[];
};

function slugify(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function toDatetimeLocal(value: string | null | undefined): string {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const pad = (part: number) => String(part).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function emptyVariation(): ProductVariation {
    return {
        name: '',
        options: [{ value: '', label: '', price_modifier: 0 }],
    };
}

function CopyableUrl({ url }: { url: string }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
        } catch {
            // Clipboard can be blocked; the URL is still selectable in the box.
        }
    };

    return (
        <div className="mt-1.5 flex items-center gap-1.5">
            <input
                readOnly
                value={url}
                onFocus={(event) => event.currentTarget.select()}
                className="border-input bg-muted/40 text-muted-foreground min-w-0 flex-1 truncate rounded-md border px-2 py-1 font-mono text-[11px]"
                aria-label="Image URL"
            />
            <button
                type="button"
                onClick={() => void copy()}
                className="border-border hover:bg-muted shrink-0 rounded-md border px-2 py-1 text-[11px]"
            >
                {copied ? 'Copied' : 'Copy'}
            </button>
        </div>
    );
}

export default function ProductForm({ product, categoryOptions }: ProductFormProps) {
    const isEditing = product !== null;
    const [tagInput, setTagInput] = useState('');

    const { data, setData, post, put, processing, errors, transform } = useForm<FormData>({
        name: product?.name ?? '',
        description: product?.description ?? '',
        price: product?.price ?? '',
        sale_price: product?.sale_price ?? '',
        sale_starts_at: toDatetimeLocal(product?.sale_starts_at),
        sale_ends_at: toDatetimeLocal(product?.sale_ends_at),
        category_id: product?.category_id != null ? String(product.category_id) : (categoryOptions[0]?.value ?? ''),
        product_image: null,
        product_image_url: '',
        gallery_files: [],
        existing_gallery: product?.gallery ?? [],
        stock_quantity: product?.stock_quantity ?? 0,
        is_featured: product?.is_featured ?? false,
        is_active: product?.is_active ?? true,
        available_for_pickup: product?.available_for_pickup ?? true,
        preparation_time: product?.preparation_time ?? 'Ready in 2 Hours',
        serves: product?.serves ?? '',
        tags: product?.tags ?? [],
        variations: product?.variations?.length ? product.variations : [],
    });

    transform((formData) => {
        const variations = formData.variations
            .filter((variation) => variation.name.trim() !== '')
            .map((variation) => ({
                ...variation,
                options: variation.options
                    .filter((option) => option.label.trim() !== '')
                    .map((option) => ({
                        ...option,
                        value: slugify(option.label),
                    })),
            }))
            .filter((variation) => variation.options.length > 0);

        return {
            ...formData,
            variations: JSON.stringify(variations),
            tags: JSON.stringify(formData.tags),
            existing_gallery: JSON.stringify(formData.existing_gallery),
            sale_price: formData.sale_price || null,
            sale_starts_at: formData.sale_starts_at || null,
            sale_ends_at: formData.sale_ends_at || null,
        };
    });

    const productImagePreview = useMemo(() => {
        if (data.product_image) {
            return URL.createObjectURL(data.product_image);
        }

        return data.product_image_url.trim() || product?.image_url || null;
    }, [data.product_image, data.product_image_url, product?.image_url]);

    const productImageRequired = !isEditing || !product?.image_url;

    const newGalleryPreviews = useMemo(
        () =>
            data.gallery_files.map((file) => ({
                file,
                url: URL.createObjectURL(file),
                type: file.type.startsWith('video/') ? ('video' as const) : ('image' as const),
            })),
        [data.gallery_files],
    );

    const submit = (event: FormEvent) => {
        event.preventDefault();

        const options = { forceFormData: true };

        if (isEditing && product) {
            put(`/admin/products/${product.id}`, options);
            return;
        }

        post('/admin/products', options);
    };

    const addTag = (raw: string) => {
        const tag = raw.trim().replace(/,$/, '');

        if (!tag || data.tags.includes(tag)) {
            return;
        }

        setData('tags', [...data.tags, tag]);
        setTagInput('');
    };

    const handleTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            addTag(tagInput);
        }
    };

    const addVariation = () => {
        setData('variations', [...data.variations, emptyVariation()]);
    };

    const updateVariation = (index: number, variation: ProductVariation) => {
        setData(
            'variations',
            data.variations.map((entry, i) => (i === index ? variation : entry)),
        );
    };

    const removeVariation = (index: number) => {
        setData(
            'variations',
            data.variations.filter((_, i) => i !== index),
        );
    };

    const [galleryUrl, setGalleryUrl] = useState('');
    const [galleryUrlError, setGalleryUrlError] = useState<string | null>(null);

    const addGalleryUrl = () => {
        const url = galleryUrl.trim();

        if (!/^https?:\/\/\S+$/i.test(url)) {
            setGalleryUrlError('Paste a full web address starting with https://');

            return;
        }

        if (data.existing_gallery.some((item) => item.url === url)) {
            setGalleryUrlError('That image is already in the gallery.');

            return;
        }

        const isVideo = /\.(mp4|webm|mov)(\?.*)?$/i.test(url);
        setData('existing_gallery', [...data.existing_gallery, { type: isVideo ? 'video' : 'image', url }]);
        setGalleryUrl('');
        setGalleryUrlError(null);
    };

    const removeExistingGalleryItem = (index: number) => {
        setData(
            'existing_gallery',
            data.existing_gallery.filter((_, i) => i !== index),
        );
    };

    const removeNewGalleryFile = (index: number) => {
        setData(
            'gallery_files',
            data.gallery_files.filter((_, i) => i !== index),
        );
    };

    return (
        <DashboardLayout
            variant="admin"
            title={isEditing ? 'Edit Product' : 'Add New Product'}
            subtitle={isEditing ? 'Update menu item details' : 'Create a new menu item'}
        >
            <Head title={`${isEditing ? 'Edit' : 'Add'} Product — Admin`} />

            <div className="mb-6">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/products">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Products
                    </Link>
                </Button>
            </div>

            <form onSubmit={submit} className="w-full space-y-8">
                <section className="border-border rounded-xl border bg-white p-6 shadow-sm">
                    <h2 className="font-heading text-lg">Basic information</h2>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <Label htmlFor="name" required>
                                Product name
                            </Label>
                            <Input id="name" required value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1.5" />
                            {errors.name && <p className="font-body text-destructive mt-1 text-xs">{errors.name}</p>}
                        </div>

                        <div>
                            <Label htmlFor="category_id" required>
                                Category
                            </Label>
                            <Select value={data.category_id} onValueChange={(value) => setData('category_id', value)}>
                                <SelectTrigger id="category_id" className="mt-1.5">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categoryOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.category_id && <p className="font-body text-destructive mt-1 text-xs">{errors.category_id}</p>}
                        </div>

                        <div>
                            <Label htmlFor="serves">Serves</Label>
                            <Input
                                id="serves"
                                value={data.serves}
                                onChange={(e) => setData('serves', e.target.value)}
                                placeholder="1–2 people"
                                className="mt-1.5"
                            />
                        </div>

                        <div>
                            <Label htmlFor="preparation_time">Preparation time</Label>
                            <Input
                                id="preparation_time"
                                value={data.preparation_time}
                                onChange={(e) => setData('preparation_time', e.target.value)}
                                className="mt-1.5"
                            />
                        </div>

                        <div className="sm:col-span-2 lg:col-span-4">
                            <Label htmlFor="description" required>
                                Description
                            </Label>
                            <Textarea
                                id="description"
                                required
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                className="mt-1.5 min-h-[120px]"
                            />
                            {errors.description && <p className="font-body text-destructive mt-1 text-xs">{errors.description}</p>}
                        </div>
                    </div>
                </section>

                <section className="border-border rounded-xl border bg-white p-6 shadow-sm">
                    <h2 className="font-heading text-lg">Media</h2>
                    <div className="mt-4 grid gap-6 lg:grid-cols-2">
                        <div>
                            <Label htmlFor="product_image" required={productImageRequired && data.product_image_url.trim() === ''}>
                                Product image
                            </Label>
                            <Input
                                id="product_image"
                                type="file"
                                accept="image/*"
                                required={productImageRequired && data.product_image_url.trim() === ''}
                                className="mt-1.5"
                                onChange={(e) => setData('product_image', e.target.files?.[0] ?? null)}
                            />
                            {productImagePreview && (
                                <img
                                    src={productImagePreview}
                                    alt="Product preview"
                                    className="border-border mt-3 h-40 w-full rounded-lg border object-cover"
                                />
                            )}
                            {!data.product_image && product?.image_url && <CopyableUrl url={product.image_url} />}
                            <div className="mt-3">
                                <Label htmlFor="product_image_url">Or paste the URL of an image already uploaded</Label>
                                <Input
                                    id="product_image_url"
                                    type="url"
                                    inputMode="url"
                                    placeholder="https://…/storage/products/example.jpg"
                                    className="mt-1.5"
                                    value={data.product_image_url}
                                    disabled={data.product_image !== null}
                                    onChange={(e) => setData('product_image_url', e.target.value)}
                                />
                                {errors.product_image_url && <p className="font-body text-destructive mt-1 text-xs">{errors.product_image_url}</p>}
                            </div>
                            {errors.product_image && <p className="font-body text-destructive mt-1 text-xs">{errors.product_image}</p>}
                        </div>

                        <div>
                            <Label htmlFor="gallery_files">Product gallery</Label>
                            <p className="font-body text-muted-foreground mt-1 text-xs">Upload multiple images or videos for the product gallery.</p>
                            <Input
                                id="gallery_files"
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                className="mt-1.5"
                                onChange={(e) => setData('gallery_files', [...data.gallery_files, ...Array.from(e.target.files ?? [])])}
                            />

                            <div className="mt-3">
                                <Label htmlFor="gallery_url">Or add an already uploaded image by URL</Label>
                                <div className="mt-1.5 flex gap-2">
                                    <Input
                                        id="gallery_url"
                                        type="url"
                                        inputMode="url"
                                        placeholder="https://…/storage/products/gallery/example.jpg"
                                        value={galleryUrl}
                                        onChange={(e) => {
                                            setGalleryUrl(e.target.value);
                                            setGalleryUrlError(null);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addGalleryUrl();
                                            }
                                        }}
                                    />
                                    <Button type="button" variant="outline" onClick={addGalleryUrl} disabled={galleryUrl.trim() === ''}>
                                        Add
                                    </Button>
                                </div>
                                {galleryUrlError && <p className="font-body text-destructive mt-1 text-xs">{galleryUrlError}</p>}
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {data.existing_gallery.map((item, index) => (
                                    <div key={`existing-${index}`} className="relative">
                                        {item.type === 'video' ? (
                                            <video src={item.url} className="border-border h-24 w-full rounded-md border object-cover" />
                                        ) : (
                                            <img src={item.url} alt="" className="border-border h-24 w-full rounded-md border object-cover" />
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removeExistingGalleryItem(index)}
                                            className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                        <CopyableUrl url={item.url} />
                                    </div>
                                ))}

                                {newGalleryPreviews.map((item, index) => (
                                    <div key={`new-${index}`} className="relative">
                                        {item.type === 'video' ? (
                                            <video src={item.url} className="border-border h-24 w-full rounded-md border object-cover" />
                                        ) : (
                                            <img src={item.url} alt="" className="border-border h-24 w-full rounded-md border object-cover" />
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removeNewGalleryFile(index)}
                                            className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="border-border rounded-xl border bg-white p-6 shadow-sm">
                    <h2 className="font-heading text-lg">Pricing & inventory</h2>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                        <div>
                            <Label htmlFor="price" required>
                                Regular price ($)
                            </Label>
                            <Input
                                id="price"
                                type="number"
                                min="0"
                                step="0.01"
                                required
                                value={data.price}
                                onChange={(e) => setData('price', e.target.value)}
                                className="mt-1.5"
                            />
                            {errors.price && <p className="font-body text-destructive mt-1 text-xs">{errors.price}</p>}
                        </div>

                        <div>
                            <Label htmlFor="sale_price">Sale price ($)</Label>
                            <Input
                                id="sale_price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={data.sale_price}
                                onChange={(e) => setData('sale_price', e.target.value)}
                                placeholder="Optional"
                                className="mt-1.5"
                            />
                        </div>

                        <div>
                            <Label htmlFor="sale_starts_at">Sale starts</Label>
                            <Input
                                id="sale_starts_at"
                                type="datetime-local"
                                value={data.sale_starts_at}
                                onChange={(e) => setData('sale_starts_at', e.target.value)}
                                className="mt-1.5"
                            />
                        </div>

                        <div>
                            <Label htmlFor="sale_ends_at">Sale ends</Label>
                            <Input
                                id="sale_ends_at"
                                type="datetime-local"
                                value={data.sale_ends_at}
                                onChange={(e) => setData('sale_ends_at', e.target.value)}
                                className="mt-1.5"
                            />
                        </div>

                        <div>
                            <Label htmlFor="stock_quantity" required>
                                Stock quantity
                            </Label>
                            <Input
                                id="stock_quantity"
                                type="number"
                                min="0"
                                required
                                value={data.stock_quantity}
                                onChange={(e) => setData('stock_quantity', Number(e.target.value))}
                                className="mt-1.5"
                            />
                        </div>
                    </div>
                </section>

                <section className="border-border rounded-xl border bg-white p-6 shadow-sm">
                    <h2 className="font-heading text-lg">Product tags</h2>
                    <p className="font-body text-muted-foreground mt-1 text-sm">Press Enter or comma to add a tag.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {data.tags.map((tag) => (
                            <span
                                key={tag}
                                className="bg-primary/10 font-body text-primary inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm"
                            >
                                {tag}
                                <button
                                    type="button"
                                    onClick={() =>
                                        setData(
                                            'tags',
                                            data.tags.filter((entry) => entry !== tag),
                                        )
                                    }
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        onBlur={() => tagInput.trim() && addTag(tagInput)}
                        placeholder="Add a tag and press Enter"
                        className="mt-3"
                    />
                </section>

                <section className="border-border rounded-xl border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h2 className="font-heading text-lg">Product attributes & variations</h2>
                            <p className="font-body text-muted-foreground mt-1 text-sm">
                                Add attributes like Size or Portion with values and price adjustments.
                            </p>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={addVariation}>
                            <Plus className="h-4 w-4" />
                            Add attribute
                        </Button>
                    </div>

                    {data.variations.length === 0 ? (
                        <p className="font-body text-muted-foreground mt-4 text-sm">No attributes yet. Customers will only see the regular price.</p>
                    ) : (
                        <div className="mt-4 space-y-6">
                            {data.variations.map((variation, variationIndex) => (
                                <div key={variationIndex} className="border-border rounded-lg border p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-1">
                                            <Label required>Attribute name</Label>
                                            <Input
                                                required
                                                value={variation.name}
                                                onChange={(e) =>
                                                    updateVariation(variationIndex, {
                                                        ...variation,
                                                        name: e.target.value,
                                                    })
                                                }
                                                placeholder="e.g. Size, Portion, Protein"
                                                className="mt-1.5"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive mt-7"
                                            onClick={() => removeVariation(variationIndex)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        <div className="font-body text-muted-foreground hidden gap-2 text-xs tracking-wider uppercase md:grid md:grid-cols-[1fr_1fr_120px_40px]">
                                            <span>
                                                Value name<span className="text-destructive ml-0.5">*</span>
                                            </span>
                                            <span>Slug (auto)</span>
                                            <span>Price +/-</span>
                                            <span />
                                        </div>

                                        {variation.options.map((option, optionIndex) => (
                                            <div key={optionIndex} className="grid gap-2 md:grid-cols-[1fr_1fr_120px_40px]">
                                                <Input
                                                    required
                                                    value={option.label}
                                                    placeholder="1 plate"
                                                    onChange={(e) => {
                                                        const label = e.target.value;
                                                        const options = [...variation.options];
                                                        options[optionIndex] = {
                                                            ...option,
                                                            label,
                                                            value: slugify(label),
                                                        };
                                                        updateVariation(variationIndex, {
                                                            ...variation,
                                                            options,
                                                        });
                                                    }}
                                                />
                                                <Input
                                                    value={slugify(option.label)}
                                                    readOnly
                                                    tabIndex={-1}
                                                    className="bg-muted text-muted-foreground"
                                                    placeholder="auto-generated"
                                                />
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={option.price_modifier}
                                                    onChange={(e) => {
                                                        const options = [...variation.options];
                                                        options[optionIndex] = {
                                                            ...option,
                                                            price_modifier: Number(e.target.value),
                                                        };
                                                        updateVariation(variationIndex, {
                                                            ...variation,
                                                            options,
                                                        });
                                                    }}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        const options = variation.options.filter((_, i) => i !== optionIndex);
                                                        updateVariation(variationIndex, {
                                                            ...variation,
                                                            options:
                                                                options.length > 0
                                                                    ? options
                                                                    : [
                                                                          {
                                                                              value: '',
                                                                              label: '',
                                                                              price_modifier: 0,
                                                                          },
                                                                      ],
                                                        });
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}

                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                updateVariation(variationIndex, {
                                                    ...variation,
                                                    options: [
                                                        ...variation.options,
                                                        {
                                                            value: '',
                                                            label: '',
                                                            price_modifier: 0,
                                                        },
                                                    ],
                                                })
                                            }
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add value
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="border-border rounded-xl border bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap gap-6">
                        <label className="font-body flex items-center gap-2 text-sm">
                            <Checkbox checked={data.is_featured} onCheckedChange={(checked) => setData('is_featured', checked === true)} />
                            Featured product
                        </label>
                        <label className="font-body flex items-center gap-2 text-sm">
                            <Checkbox checked={data.is_active} onCheckedChange={(checked) => setData('is_active', checked === true)} />
                            Active on menu
                        </label>
                        <label className="font-body flex items-center gap-2 text-sm">
                            <Checkbox
                                checked={data.available_for_pickup}
                                onCheckedChange={(checked) => setData('available_for_pickup', checked === true)}
                            />
                            Available for pickup
                        </label>
                    </div>

                    <div className="border-border mt-6 flex gap-3 border-t pt-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Product'}
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href="/admin/products">Cancel</Link>
                        </Button>
                    </div>
                </section>
            </form>
        </DashboardLayout>
    );
}
