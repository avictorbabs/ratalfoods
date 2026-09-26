import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import DashboardLayout from '@/layouts/dashboard-layout';

type CategoryRecord = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    sort_order: number;
};

type CategoryFormProps = {
    category: CategoryRecord | null;
};

type FormData = {
    name: string;
    slug: string;
    description: string;
    sort_order: number;
    category_image: File | null;
};

function slugify(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

export default function CategoryForm({ category }: CategoryFormProps) {
    const isEditing = category !== null;
    const slugManuallyEdited = useRef(isEditing);

    const { data, setData, post, put, processing, errors } = useForm<FormData>({
        name: category?.name ?? '',
        slug: category?.slug ?? '',
        description: category?.description ?? '',
        sort_order: category?.sort_order ?? 0,
        category_image: null,
    });

    const [imagePreview, setImagePreview] = useState<string | null>(category?.image_url ?? null);
    const thumbnailRequired = !isEditing || !category?.image_url;

    useEffect(() => {
        if (slugManuallyEdited.current) {
            return;
        }

        setData('slug', slugify(data.name));
    }, [data.name]);

    const handleImageChange = (file: File | null) => {
        setData('category_image', file);

        if (file) {
            setImagePreview(URL.createObjectURL(file));
        } else {
            setImagePreview(category?.image_url ?? null);
        }
    };

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();

        if (isEditing && category) {
            put(`/admin/categories/${category.id}`, {
                forceFormData: true,
            });
            return;
        }

        post('/admin/categories', {
            forceFormData: true,
        });
    };

    return (
        <DashboardLayout variant="admin">
            <Head title={isEditing ? 'Edit Category' : 'Add Category'} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="shrink-0">
                        <Link href="/admin/categories">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="sr-only">Back to categories</span>
                        </Link>
                    </Button>
                    <div>
                        <h1 className="font-heading text-2xl tracking-tight text-foreground">
                            {isEditing ? 'Edit Category' : 'Add New Category'}
                        </h1>
                        <p className="mt-1 font-body text-sm text-muted-foreground">
                            {isEditing
                                ? 'Update category details and thumbnail'
                                : 'Create a category for your menu'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                        <div className="grid gap-6 lg:grid-cols-2">
                            <div>
                                <Label htmlFor="name" required>Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(event) => setData('name', event.target.value)}
                                    className="mt-1.5"
                                    required
                                />
                                {errors.name && (
                                    <p className="mt-1 font-body text-xs text-destructive">{errors.name}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="slug" required>Slug</Label>
                                <Input
                                    id="slug"
                                    value={data.slug}
                                    onChange={(event) => {
                                        slugManuallyEdited.current = true;
                                        setData('slug', slugify(event.target.value));
                                    }}
                                    className="mt-1.5 font-mono text-sm"
                                    required
                                />
                                {errors.slug && (
                                    <p className="mt-1 font-body text-xs text-destructive">{errors.slug}</p>
                                )}
                            </div>

                            <div className="lg:col-span-2">
                                <Label htmlFor="description">Description</Label>
                                <RichTextEditor
                                    id="description"
                                    value={data.description}
                                    onChange={(value) => setData('description', value)}
                                    placeholder="Describe this category. Use lists to highlight featured dishes."
                                    className="mt-1.5"
                                />
                                {errors.description && (
                                    <p className="mt-1 font-body text-xs text-destructive">
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="sort_order">Sort order</Label>
                                <Input
                                    id="sort_order"
                                    type="number"
                                    min={0}
                                    value={data.sort_order}
                                    onChange={(event) =>
                                        setData('sort_order', Number(event.target.value) || 0)
                                    }
                                    className="mt-1.5"
                                />
                                {errors.sort_order && (
                                    <p className="mt-1 font-body text-xs text-destructive">
                                        {errors.sort_order}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="category_image" required={thumbnailRequired}>Thumbnail</Label>
                                <Input
                                    id="category_image"
                                    type="file"
                                    required={thumbnailRequired}
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    onChange={(event) =>
                                        handleImageChange(event.target.files?.[0] ?? null)
                                    }
                                    className="mt-1.5"
                                />
                                {errors.category_image && (
                                    <p className="mt-1 font-body text-xs text-destructive">
                                        {errors.category_image}
                                    </p>
                                )}
                                {imagePreview && (
                                    <div className="mt-3 h-24 w-24 overflow-hidden rounded-md border border-border">
                                        <img
                                            src={imagePreview}
                                            alt="Category thumbnail preview"
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/admin/categories">Cancel</Link>
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            {processing
                                ? 'Saving...'
                                : isEditing
                                  ? 'Save Changes'
                                  : 'Create Category'}
                        </Button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
