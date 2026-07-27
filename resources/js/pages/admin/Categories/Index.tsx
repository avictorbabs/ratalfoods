import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { stripHtml } from '@/components/ui/rich-text-editor';
import DashboardLayout from '@/layouts/dashboard-layout';

type CategoryRow = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    sort_order: number;
    products_count: number;
};

type PaginatedCategories = {
    data: CategoryRow[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type CategoriesIndexProps = {
    categories: PaginatedCategories;
    filters: {
        search: string;
    };
};

const SEARCH_DEBOUNCE_MS = 300;
const DESCRIPTION_PREVIEW_LENGTH = 80;

function truncateText(text: string | null, maxLength: number): string {
    const plain = stripHtml(text);

    if (!plain) {
        return '—';
    }

    if (plain.length <= maxLength) {
        return plain;
    }

    return `${plain.slice(0, maxLength).trimEnd()}…`;
}

function filterParams(search: string) {
    return {
        search: search.trim() || undefined,
    };
}

export default function CategoriesIndex({ categories, filters }: CategoriesIndexProps) {
    const [search, setSearch] = useState(filters.search);
    const [deleteCategory, setDeleteCategory] = useState<CategoryRow | null>(null);
    const [deleting, setDeleting] = useState(false);
    const mounted = useRef(false);
    const skipEffects = useRef(false);
    const searchRef = useRef(search);

    searchRef.current = search;

    const fetchCategories = (searchValue: string) => {
        router.get('/admin/categories', filterParams(searchValue), {
            preserveState: true,
            replace: true,
            preserveScroll: true,
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

            fetchCategories(searchRef.current);
        }, SEARCH_DEBOUNCE_MS);

        return () => window.clearTimeout(timer);
    }, [search]);

    const clearFilters = () => {
        skipEffects.current = true;
        setSearch('');
        router.get('/admin/categories', {}, {
            preserveState: true,
            replace: true,
            preserveScroll: true,
            onFinish: () => {
                skipEffects.current = false;
            },
        });
    };

    const handleDelete = (category: CategoryRow) => {
        setDeleteCategory(category);
    };

    const confirmDelete = () => {
        if (!deleteCategory) {
            return;
        }

        setDeleting(true);
        router.delete(`/admin/categories/${deleteCategory.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteCategory(null);
            },
        });
    };

    const hasActiveFilters = search.trim() !== '';

    return (
        <DashboardLayout variant="admin">
            <Head title="Categories" />

            <div className="space-y-6">
                <div>
                    <h1 className="font-heading text-2xl tracking-tight text-foreground">Categories</h1>
                    <p className="mt-1 font-body text-sm text-muted-foreground">
                        Manage menu categories shown on the storefront
                    </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <label
                        htmlFor="category-search"
                        className="mb-1.5 block font-body text-xs font-medium uppercase tracking-wider text-muted-foreground"
                    >
                        Search
                    </label>
                    <div className="relative max-w-md">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="category-search"
                            placeholder="Name, slug, or description..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="pl-10"
                        />
                    </div>
                    {hasActiveFilters && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="mt-3 font-body text-xs"
                        >
                            Clear filters
                        </Button>
                    )}
                </div>

                <div className="rounded-xl border border-border bg-card shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <h2 className="font-heading text-lg text-foreground">
                            All Categories ({categories.total})
                        </h2>
                        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                            <Link href="/admin/categories/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Add New Category
                            </Link>
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px]">
                            <thead>
                                <tr className="border-b border-border bg-muted/40">
                                    <th className="px-4 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-muted-foreground sm:px-6">
                                        Thumbnail
                                    </th>
                                    <th className="px-4 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Name
                                    </th>
                                    <th className="px-4 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Slug
                                    </th>
                                    <th className="px-4 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Description
                                    </th>
                                    <th className="px-4 py-3 text-right font-body text-xs font-medium uppercase tracking-wider text-muted-foreground sm:px-6">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-12 text-center font-body text-sm text-muted-foreground"
                                        >
                                            No categories found.
                                        </td>
                                    </tr>
                                ) : (
                                    categories.data.map((category) => (
                                        <tr
                                            key={category.id}
                                            className="border-b border-border last:border-b-0 hover:bg-muted/20"
                                        >
                                            <td className="px-4 py-4 sm:px-6">
                                                <div className="h-12 w-12 overflow-hidden rounded-md border border-border bg-muted">
                                                    {category.image_url ? (
                                                        <img
                                                            src={category.image_url}
                                                            alt={category.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center font-body text-[10px] uppercase tracking-wider text-muted-foreground">
                                                            No image
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="font-body text-sm font-medium text-foreground">
                                                    {category.name}
                                                </p>
                                                {category.products_count > 0 && (
                                                    <p className="mt-0.5 font-body text-xs text-muted-foreground">
                                                        {category.products_count} product
                                                        {category.products_count === 1 ? '' : 's'}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                                                {category.slug}
                                            </td>
                                            <td className="max-w-xs px-4 py-4">
                                                <p
                                                    className="font-body text-sm text-muted-foreground"
                                                    title={stripHtml(category.description) || undefined}
                                                >
                                                    {truncateText(
                                                        category.description,
                                                        DESCRIPTION_PREVIEW_LENGTH,
                                                    )}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4 sm:px-6">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        asChild
                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                    >
                                                        <Link href={`/admin/categories/${category.id}/edit`}>
                                                            <Pencil className="h-4 w-4" />
                                                            <span className="sr-only">Edit {category.name}</span>
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(category)}
                                                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="sr-only">Delete {category.name}</span>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {categories.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-center gap-1 border-t border-border px-4 py-4">
                            {categories.links.map((link, index) => {
                                if (!link.url) {
                                    return (
                                        <span
                                            key={`${link.label}-${index}`}
                                            className="px-3 py-1.5 font-body text-sm text-muted-foreground"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                }

                                return (
                                    <Link
                                        key={`${link.label}-${index}`}
                                        href={link.url}
                                        preserveState
                                        preserveScroll
                                        className={`rounded-md px-3 py-1.5 font-body text-sm transition-colors ${
                                            link.active
                                                ? 'bg-primary text-primary-foreground'
                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <Dialog
                open={deleteCategory !== null}
                onOpenChange={(open) => !open && !deleting && setDeleteCategory(null)}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-heading">Delete category?</DialogTitle>
                        <DialogDescription className="font-body">
                            {deleteCategory && (
                                <>
                                    You are about to permanently delete{' '}
                                    <span className="font-medium text-foreground">
                                        {deleteCategory.name}
                                    </span>
                                    . This action cannot be undone.
                                    {deleteCategory.products_count > 0 && (
                                        <>
                                            {' '}
                                            <span className="font-medium text-foreground">
                                                {deleteCategory.products_count} product
                                                {deleteCategory.products_count === 1 ? '' : 's'}
                                            </span>{' '}
                                            are assigned to this category.
                                        </>
                                    )}
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteCategory(null)}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
                            {deleting ? 'Deleting…' : 'Delete Category'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
