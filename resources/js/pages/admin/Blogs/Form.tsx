import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/layouts/dashboard-layout';

type BlogPostRecord = {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    image_url: string | null;
    published_at: string | null;
    is_published: boolean;
};

type BlogFormProps = {
    post: BlogPostRecord | null;
};

type FormData = {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    published_at: string;
    is_published: boolean;
    image: File | null;
    media_files: File[];
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

export default function BlogForm({ post }: BlogFormProps) {
    const isEditing = post !== null;
    const slugManuallyEdited = useRef(isEditing);
    const [coverPreview, setCoverPreview] = useState<string | null>(post?.image_url ?? null);

    const { data, setData, post: createPost, put, processing, errors } = useForm<FormData>({
        title: post?.title ?? '',
        slug: post?.slug ?? '',
        excerpt: post?.excerpt ?? '',
        content: post?.content ?? '',
        published_at: toDatetimeLocal(post?.published_at),
        is_published: post?.is_published ?? false,
        image: null,
        media_files: [],
    });

    useEffect(() => {
        if (slugManuallyEdited.current) {
            return;
        }

        setData('slug', slugify(data.title));
    }, [data.title, setData]);

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (isEditing && post) {
            put(`/admin/blogs/${post.id}`, {
                forceFormData: true,
            });
            return;
        }

        createPost('/admin/blogs', {
            forceFormData: true,
        });
    };

    return (
        <DashboardLayout variant="admin">
            <Head title={isEditing ? 'Edit Blog Post' : 'New Blog Post'} />

            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="icon">
                        <Link href="/admin/blogs">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="sr-only">Back to blogs</span>
                        </Link>
                    </Button>
                    <div>
                        <h1 className="font-heading text-2xl tracking-tight text-foreground">
                            {isEditing ? 'Edit Blog Post' : 'Create Blog Post'}
                        </h1>
                        <p className="mt-1 font-body text-sm text-muted-foreground">
                            Write rich content and attach media for your article
                        </p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                            <div>
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(event) => setData('title', event.target.value)}
                                    className="mt-1.5"
                                    required
                                />
                                {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
                            </div>
                            <div>
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    value={data.slug}
                                    onChange={(event) => {
                                        slugManuallyEdited.current = true;
                                        setData('slug', slugify(event.target.value));
                                    }}
                                    className="mt-1.5 font-mono text-sm"
                                />
                                {errors.slug && <p className="mt-1 text-xs text-destructive">{errors.slug}</p>}
                            </div>

                            <div className="lg:col-span-2">
                                <Label htmlFor="excerpt">Excerpt</Label>
                                <Textarea
                                    id="excerpt"
                                    value={data.excerpt}
                                    onChange={(event) => setData('excerpt', event.target.value)}
                                    rows={3}
                                    className="mt-1.5"
                                    placeholder="Short summary (optional)"
                                />
                                {errors.excerpt && <p className="mt-1 text-xs text-destructive">{errors.excerpt}</p>}
                            </div>

                            <div>
                                <Label htmlFor="published_at">Published At</Label>
                                <Input
                                    id="published_at"
                                    type="datetime-local"
                                    value={data.published_at}
                                    onChange={(event) => setData('published_at', event.target.value)}
                                    className="mt-1.5"
                                />
                                {errors.published_at && (
                                    <p className="mt-1 text-xs text-destructive">{errors.published_at}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="image">Featured Image</Label>
                                <Input
                                    id="image"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    onChange={(event) => {
                                        const file = event.target.files?.[0] ?? null;
                                        setData('image', file);
                                        setCoverPreview(file ? URL.createObjectURL(file) : (post?.image_url ?? null));
                                    }}
                                    className="mt-1.5"
                                />
                                {errors.image && <p className="mt-1 text-xs text-destructive">{errors.image}</p>}
                                {coverPreview && (
                                    <div className="mt-3 h-24 w-40 overflow-hidden rounded-md border border-border">
                                        <img src={coverPreview} alt="Cover preview" className="h-full w-full object-cover" />
                                    </div>
                                )}
                            </div>

                            <div className="lg:col-span-2">
                                <Label htmlFor="media_files">Attach Media to Content (images/videos)</Label>
                                <Input
                                    id="media_files"
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                                    onChange={(event) => setData('media_files', Array.from(event.target.files ?? []))}
                                    className="mt-1.5"
                                />
                                <p className="mt-1 font-body text-xs text-muted-foreground">
                                    Uploaded files are appended to the end of your content.
                                </p>
                                {errors.media_files && <p className="mt-1 text-xs text-destructive">{errors.media_files}</p>}
                            </div>

                            <div className="lg:col-span-2">
                                <label className="flex items-center gap-2 font-body text-sm">
                                    <Checkbox
                                        checked={data.is_published}
                                        onCheckedChange={(checked) => setData('is_published', checked === true)}
                                    />
                                    Publish this post
                                </label>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <Label htmlFor="content">Content</Label>
                        <RichTextEditor
                            id="content"
                            value={data.content}
                            onChange={(value) => setData('content', value)}
                            placeholder="Write your post content..."
                            className="mt-2"
                        />
                        {errors.content && <p className="mt-1 text-xs text-destructive">{errors.content}</p>}
                    </section>

                    <div className="flex gap-3">
                        <Button type="submit" disabled={processing} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            {processing ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Post'}
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href="/admin/blogs">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
