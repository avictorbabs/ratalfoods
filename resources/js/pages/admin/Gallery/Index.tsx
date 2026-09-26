import { Head, router, useForm } from '@inertiajs/react';
import { Image, Search, Trash2, Video } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/layouts/dashboard-layout';

type GalleryItem = {
    id: number;
    title: string | null;
    description: string | null;
    media_type: 'image' | 'video';
    media_url: string;
    sort_order: number;
    is_featured: boolean;
    is_active: boolean;
};

type PaginatedGalleryItems = {
    data: GalleryItem[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type GalleryAdminProps = {
    items: PaginatedGalleryItems;
    filters: {
        search: string;
    };
};

const SEARCH_DEBOUNCE_MS = 300;

function filterParams(search: string) {
    return {
        search: search.trim() || undefined,
    };
}

export default function GalleryAdminIndex({ items, filters }: GalleryAdminProps) {
    const [search, setSearch] = useState(filters.search);
    const [deleteItem, setDeleteItem] = useState<GalleryItem | null>(null);
    const [deleting, setDeleting] = useState(false);
    const mounted = useRef(false);
    const skipEffects = useRef(false);
    const searchRef = useRef(search);
    searchRef.current = search;

    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
    } = useForm<{
        title: string;
        description: string;
        sort_order: number;
        is_featured: boolean;
        is_active: boolean;
        media_file: File | null;
    }>({
        title: '',
        description: '',
        sort_order: 0,
        is_featured: false,
        is_active: true,
        media_file: null,
    });

    const fetchItems = (searchValue: string) => {
        router.get('/admin/gallery', filterParams(searchValue), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
            return;
        }

        if (skipEffects.current) {
            return;
        }

        const timer = window.setTimeout(() => {
            const serverSearch = filters.search ?? '';
            if (search.trim() === serverSearch.trim()) {
                return;
            }

            fetchItems(searchRef.current);
        }, SEARCH_DEBOUNCE_MS);

        return () => window.clearTimeout(timer);
    }, [search, filters.search]);

    const clearFilters = () => {
        skipEffects.current = true;
        setSearch('');
        router.get('/admin/gallery', {}, {
            preserveState: true,
            replace: true,
            preserveScroll: true,
            onFinish: () => {
                skipEffects.current = false;
            },
        });
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        post('/admin/gallery', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
            },
        });
    };

    const remove = (item: GalleryItem) => {
        setDeleteItem(item);
    };

    const confirmDelete = () => {
        if (!deleteItem) {
            return;
        }

        setDeleting(true);
        router.delete(`/admin/gallery/${deleteItem.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteItem(null);
            },
        });
    };

    return (
        <DashboardLayout variant="admin">
            <Head title="Gallery" />

            <div className="space-y-6">
                <div>
                    <h1 className="font-heading text-2xl tracking-tight text-foreground">Gallery</h1>
                    <p className="mt-1 font-body text-sm text-muted-foreground">
                        Manage gallery images and videos shown on the public gallery page
                    </p>
                </div>

                <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
                    <h2 className="font-heading text-lg text-foreground">Add Media</h2>

                    <form onSubmit={submit} className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div>
                            <Label htmlFor="title" required>Title</Label>
                            <Input
                                id="title"
                                required
                                value={data.title}
                                onChange={(event) => setData('title', event.target.value)}
                                className="mt-1.5"
                            />
                            {errors.title && (
                                <p className="mt-1 text-xs text-destructive">{errors.title}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="sort_order">Sort Order</Label>
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
                                <p className="mt-1 text-xs text-destructive">{errors.sort_order}</p>
                            )}
                        </div>

                        <div className="lg:col-span-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(event) => setData('description', event.target.value)}
                                rows={3}
                                className="mt-1.5"
                            />
                            {errors.description && (
                                <p className="mt-1 text-xs text-destructive">{errors.description}</p>
                            )}
                        </div>

                        <div className="lg:col-span-2">
                            <Label htmlFor="media_file" required>Image or Video</Label>
                            <Input
                                id="media_file"
                                type="file"
                                required
                                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                                onChange={(event) => setData('media_file', event.target.files?.[0] ?? null)}
                                className="mt-1.5"
                            />
                            {errors.media_file && (
                                <p className="mt-1 text-xs text-destructive">{errors.media_file}</p>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-6 lg:col-span-2">
                            <label className="flex items-center gap-2 font-body text-sm">
                                <Checkbox
                                    checked={data.is_featured}
                                    onCheckedChange={(checked) => setData('is_featured', checked === true)}
                                />
                                Featured section media
                            </label>
                            <label className="flex items-center gap-2 font-body text-sm">
                                <Checkbox
                                    checked={data.is_active}
                                    onCheckedChange={(checked) => setData('is_active', checked === true)}
                                />
                                Active on gallery page
                            </label>
                        </div>

                        <div className="lg:col-span-2">
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                {processing ? 'Uploading…' : 'Add to Gallery'}
                            </Button>
                        </div>
                    </form>
                </section>

                <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="font-heading text-lg text-foreground">
                            Gallery Items ({items.total})
                        </h2>
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search title or description..."
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {search.trim() !== '' && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="mb-4">
                            Clear filters
                        </Button>
                    )}

                    {items.data.length === 0 ? (
                        <p className="py-8 text-center font-body text-sm text-muted-foreground">
                            No gallery media found.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {items.data.map((item) => (
                                <article
                                    key={item.id}
                                    className="overflow-hidden rounded-md border border-border bg-background"
                                >
                                    <div className="relative h-52 w-full overflow-hidden bg-muted">
                                        {item.media_type === 'video' ? (
                                            <video
                                                src={item.media_url}
                                                className="h-full w-full object-cover"
                                                controls
                                                preload="metadata"
                                            />
                                        ) : (
                                            <img
                                                src={item.media_url}
                                                alt={item.title ?? 'Gallery media'}
                                                className="h-full w-full object-cover"
                                            />
                                        )}
                                        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-foreground/70 px-2 py-0.5 text-[11px] text-background">
                                            {item.media_type === 'video' ? (
                                                <Video className="h-3.5 w-3.5" />
                                            ) : (
                                                <Image className="h-3.5 w-3.5" />
                                            )}
                                            {item.media_type}
                                        </span>
                                    </div>
                                    <div className="space-y-2 p-3">
                                        <p className="font-body text-sm font-medium text-foreground">
                                            {item.title || 'Untitled media'}
                                        </p>
                                        <p className="line-clamp-2 font-body text-xs text-muted-foreground">
                                            {item.description || 'No description'}
                                        </p>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>Order: {item.sort_order}</span>
                                            <span>
                                                {item.is_featured ? 'Featured' : 'Regular'} ·{' '}
                                                {item.is_active ? 'Active' : 'Hidden'}
                                            </span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => remove(item)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete
                                        </Button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <Dialog
                open={deleteItem !== null}
                onOpenChange={(open) => !open && !deleting && setDeleteItem(null)}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-heading">Delete media item?</DialogTitle>
                        <DialogDescription className="font-body">
                            {deleteItem && (
                                <>
                                    You are about to permanently delete{' '}
                                    <span className="font-medium text-foreground">
                                        {deleteItem.title ?? 'this media item'}
                                    </span>
                                    . This action cannot be undone.
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteItem(null)}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
                            {deleting ? 'Deleting…' : 'Delete Media'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
