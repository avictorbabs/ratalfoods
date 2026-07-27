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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import DashboardLayout from '@/layouts/dashboard-layout';

type BlogPostRow = {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    image_url: string | null;
    published_at: string | null;
    is_published: boolean;
};

type PaginatedPosts = {
    data: BlogPostRow[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type BlogIndexProps = {
    posts: PaginatedPosts;
    filters: {
        search: string;
        status: string;
    };
};

const SEARCH_DEBOUNCE_MS = 300;

function filterParams(search: string, status: string) {
    return {
        search: search.trim() || undefined,
        status: status === 'all' ? undefined : status,
    };
}

export default function BlogIndex({ posts, filters }: BlogIndexProps) {
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status || 'all');
    const [deletePost, setDeletePost] = useState<BlogPostRow | null>(null);
    const [deleting, setDeleting] = useState(false);
    const mounted = useRef(false);
    const skipEffects = useRef(false);
    const searchRef = useRef(search);
    const statusRef = useRef(status);

    searchRef.current = search;
    statusRef.current = status;

    const fetchPosts = (searchValue: string, statusValue: string) => {
        router.get('/admin/blogs', filterParams(searchValue, statusValue), {
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

            fetchPosts(searchRef.current, statusRef.current);
        }, SEARCH_DEBOUNCE_MS);

        return () => window.clearTimeout(timer);
    }, [search, filters.search]);

    useEffect(() => {
        if (!mounted.current || skipEffects.current) {
            return;
        }

        const serverStatus = filters.status || 'all';
        if (status === serverStatus) {
            return;
        }

        fetchPosts(searchRef.current, status);
    }, [status, filters.status]);

    const clearFilters = () => {
        skipEffects.current = true;
        setSearch('');
        setStatus('all');
        router.get('/admin/blogs', {}, {
            preserveState: true,
            replace: true,
            preserveScroll: true,
            onFinish: () => {
                skipEffects.current = false;
            },
        });
    };

    const remove = (post: BlogPostRow) => {
        setDeletePost(post);
    };

    const confirmDelete = () => {
        if (!deletePost) {
            return;
        }

        setDeleting(true);
        router.delete(`/admin/blogs/${deletePost.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeletePost(null);
            },
        });
    };

    return (
        <DashboardLayout variant="admin">
            <Head title="Blogs" />

            <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="font-heading text-2xl tracking-tight text-foreground">Blogs</h1>
                        <p className="mt-1 font-body text-sm text-muted-foreground">
                            Create and manage blog posts
                        </p>
                    </div>
                    <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Link href="/admin/blogs/create">
                            <Plus className="mr-2 h-4 w-4" />
                            New Post
                        </Link>
                    </Button>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search title, slug, or content..."
                                className="pl-10"
                            />
                        </div>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {(search.trim() !== '' || status !== 'all') && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-3">
                            Clear filters
                        </Button>
                    )}
                </div>

                <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
                    <table className="w-full min-w-[840px]">
                        <thead>
                            <tr className="border-b border-border bg-muted/40">
                                <th className="px-4 py-3 text-left font-body text-xs uppercase tracking-wider text-muted-foreground">
                                    Post
                                </th>
                                <th className="px-4 py-3 text-left font-body text-xs uppercase tracking-wider text-muted-foreground">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left font-body text-xs uppercase tracking-wider text-muted-foreground">
                                    Published At
                                </th>
                                <th className="px-4 py-3 text-right font-body text-xs uppercase tracking-wider text-muted-foreground">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.data.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center font-body text-sm text-muted-foreground">
                                        No blog posts found.
                                    </td>
                                </tr>
                            ) : (
                                posts.data.map((post) => (
                                    <tr key={post.id} className="border-b border-border last:border-b-0">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-16 overflow-hidden rounded-md border border-border bg-muted">
                                                    {post.image_url ? (
                                                        <img src={post.image_url} alt={post.title} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full bg-muted" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate font-body text-sm font-medium">{post.title}</p>
                                                    <p className="truncate font-mono text-xs text-muted-foreground">{post.slug}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 font-body text-sm">
                                            {post.is_published ? 'Published' : 'Draft'}
                                        </td>
                                        <td className="px-4 py-4 font-body text-sm text-muted-foreground">
                                            {post.published_at ? new Date(post.published_at).toLocaleString() : '—'}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                                                    <Link href={`/admin/blogs/${post.id}/edit`}>
                                                        <Pencil className="h-4 w-4" />
                                                        <span className="sr-only">Edit {post.title}</span>
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => remove(post)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">Delete {post.title}</span>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Dialog
                open={deletePost !== null}
                onOpenChange={(open) => !open && !deleting && setDeletePost(null)}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-heading">Delete blog post?</DialogTitle>
                        <DialogDescription className="font-body">
                            {deletePost && (
                                <>
                                    You are about to permanently delete{' '}
                                    <span className="font-medium text-foreground">
                                        {deletePost.title}
                                    </span>
                                    . This action cannot be undone.
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeletePost(null)}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
                            {deleting ? 'Deleting…' : 'Delete Post'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
