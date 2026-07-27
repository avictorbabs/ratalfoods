import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ChevronLeft, ChevronRight, Image as ImageIcon, Video } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BlogPost } from '@/types/ratalfoods';

type BlogShowProps = {
    post: BlogPost;
    recentPosts: BlogPost[];
};

type MediaItem = {
    type: 'image' | 'video';
    src: string;
};

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function extractContentAndMedia(content: string): { contentHtml: string; media: MediaItem[] } {
    if (!/<[^>]+>/.test(content)) {
        return { contentHtml: content, media: [] };
    }

    if (typeof window === 'undefined') {
        const media: MediaItem[] = [];
        const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
        const videoRegex = /<video[^>]*src=["']([^"']+)["'][^>]*>[\s\S]*?<\/video>/gi;
        let match: RegExpExecArray | null;
        while ((match = imgRegex.exec(content)) !== null) {
            media.push({ type: 'image', src: match[1] });
        }
        while ((match = videoRegex.exec(content)) !== null) {
            media.push({ type: 'video', src: match[1] });
        }

        const stripped = content
            .replace(videoRegex, '')
            .replace(imgRegex, '')
            .replace(/<p>\s*<\/p>/g, '');

        return { contentHtml: stripped, media };
    }

    const doc = new DOMParser().parseFromString(content, 'text/html');
    const media: MediaItem[] = [];

    doc.querySelectorAll('img').forEach((img) => {
        const src = img.getAttribute('src')?.trim();
        if (src) {
            media.push({ type: 'image', src });
        }

        const parent = img.parentElement;
        if (parent && parent.tagName.toLowerCase() === 'p' && parent.childElementCount === 1) {
            parent.remove();
        } else {
            img.remove();
        }
    });

    doc.querySelectorAll('video').forEach((video) => {
        const src = video.getAttribute('src')?.trim();
        if (src) {
            media.push({ type: 'video', src });
        }

        const parent = video.parentElement;
        if (parent && parent.tagName.toLowerCase() === 'p' && parent.childElementCount === 1) {
            parent.remove();
        } else {
            video.remove();
        }
    });

    return { contentHtml: doc.body.innerHTML, media };
}

function MediaCarousel({ media, title }: { media: MediaItem[]; title: string }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const active = media[activeIndex];

    if (media.length === 0 || !active) {
        return null;
    }

    const previous = () => {
        setActiveIndex((index) => (index - 1 + media.length) % media.length);
    };

    const next = () => {
        setActiveIndex((index) => (index + 1) % media.length);
    };

    return (
        <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
            <div className="relative">
                {active.type === 'video' ? (
                    <video
                        src={active.src}
                        controls
                        preload="metadata"
                        className="aspect-[16/9] w-full bg-black object-contain"
                    />
                ) : (
                    <img
                        src={active.src}
                        alt={`${title} media ${activeIndex + 1}`}
                        className="aspect-[16/9] w-full object-cover"
                    />
                )}

                {media.length > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={previous}
                            className="absolute left-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition-colors hover:bg-black/60"
                            aria-label="Previous media"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            onClick={next}
                            className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition-colors hover:bg-black/60"
                            aria-label="Next media"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </>
                )}

                <div className="absolute right-3 top-3 rounded bg-black/45 px-2 py-1 font-body text-[11px] uppercase tracking-wider text-white">
                    {active.type === 'video' ? (
                        <span className="inline-flex items-center gap-1">
                            <Video className="h-3.5 w-3.5" />
                            Video
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1">
                            <ImageIcon className="h-3.5 w-3.5" />
                            Image
                        </span>
                    )}
                </div>
            </div>

            {media.length > 1 && (
                <div className="flex items-center justify-between border-t border-border px-4 py-2">
                    <p className="font-body text-xs text-muted-foreground">
                        Media {activeIndex + 1} of {media.length}
                    </p>
                    <div className="flex gap-1.5">
                        {media.map((_, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => setActiveIndex(index)}
                                className={`h-2.5 w-2.5 rounded-full ${
                                    index === activeIndex ? 'bg-primary' : 'bg-muted'
                                }`}
                                aria-label={`Go to media ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function NewsletterBox() {
    const { data, setData, post: submitNewsletter, processing, errors, reset } = useForm({
        name: '',
        email: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        submitNewsletter('/newsletter', {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <p className="font-body text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Stay Connected
            </p>
            <h3 className="mt-2 font-heading text-2xl tracking-tight sm:text-3xl">
                Join Our Mailing List
            </h3>
            <p className="mt-3 font-body text-sm leading-relaxed text-muted-foreground">
                Be the first to hear about new dishes and exclusive offers from Ratal Foods.
            </p>

            <form onSubmit={submit} className="mt-6 grid grid-cols-1 gap-4">
                <div>
                    <label className="mb-1.5 block font-body text-xs uppercase tracking-wider text-muted-foreground">
                        Name
                    </label>
                    <Input
                        required
                        value={data.name}
                        onChange={(event) => setData('name', event.target.value)}
                        placeholder="Your name"
                        className="h-11 font-body text-sm"
                    />
                    {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name}</p>}
                </div>

                <div>
                    <label className="mb-1.5 block font-body text-xs uppercase tracking-wider text-muted-foreground">
                        Email
                    </label>
                    <Input
                        required
                        type="email"
                        value={data.email}
                        onChange={(event) => setData('email', event.target.value)}
                        placeholder="you@example.com"
                        className="h-11 font-body text-sm"
                    />
                    {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email}</p>}
                </div>

                <Button
                    type="submit"
                    disabled={processing}
                    className="h-11 w-full font-body text-sm tracking-wide uppercase"
                >
                    {processing ? 'Subscribing...' : 'Subscribe'}
                </Button>
            </form>
        </div>
    );
}

export default function BlogShow({ post, recentPosts }: BlogShowProps) {
    const contentLooksHtml = /<[^>]+>/.test(post.content);
    const { contentHtml, media } = useMemo(
        () => extractContentAndMedia(post.content),
        [post.content],
    );

    return (
        <AppLayout>
            <Head title={post.title} />

            <div>
                <section className="relative h-64 overflow-hidden pt-20 sm:h-80 sm:pt-24">
                    <img
                        src={
                            post.image_url ??
                            'https://media.base44.com/images/public/6a2f8570f73aa7ad1929a1a5/c2233b586_generated_51c27708.png'
                        }
                        alt={post.title}
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-foreground/60" />
                    <div className="relative z-10 flex h-full items-center justify-center px-4 text-center">
                        <div>
                            <p className="mb-3 font-body text-xs uppercase tracking-[0.3em] text-background/70">
                                From Our Kitchen
                            </p>
                            <h1 className="font-heading text-4xl tracking-tight text-background sm:text-5xl">
                                {post.title}
                            </h1>
                            {post.published_at && (
                                <p className="mt-3 font-body text-xs uppercase tracking-[0.25em] text-background/80">
                                    {formatDate(post.published_at)}
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 py-8 pb-16 sm:px-6 lg:px-8 lg:pb-20">
                    <PageBreadcrumb
                        items={[
                            { title: 'Home', href: '/' },
                            { title: 'Blog', href: '/blog' },
                            { title: post.title },
                        ]}
                    />

                    <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-12">
                        <article className="lg:col-span-2">
                            <Link
                                href="/blog"
                                className="mb-8 inline-flex items-center gap-1.5 font-body text-sm text-primary hover:underline"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Back to Blog
                            </Link>

                            {post.image_url && (
                                <div className="mt-4 overflow-hidden rounded-xl border border-border">
                                    <img
                                        src={post.image_url}
                                        alt={post.title}
                                        className="aspect-[16/9] w-full object-cover"
                                    />
                                </div>
                            )}

                            <div className="prose prose-neutral mt-8 max-w-none font-body text-base leading-relaxed text-muted-foreground">
                                {contentLooksHtml ? (
                                    <div
                                        dangerouslySetInnerHTML={{ __html: contentHtml }}
                                        className="[&_img]:h-auto [&_img]:max-w-full [&_video]:h-auto [&_video]:max-w-full"
                                    />
                                ) : (
                                    post.content.split('\n\n').map((paragraph) => (
                                        <p key={paragraph} className="mb-4">
                                            {paragraph}
                                        </p>
                                    ))
                                )}
                            </div>

                            {media.length > 0 && <MediaCarousel media={media} title={post.title} />}
                        </article>

                        <aside className="space-y-8">
                            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                                <h3 className="font-heading text-2xl tracking-tight">Recent Posts</h3>
                                {recentPosts.length === 0 ? (
                                    <p className="mt-4 font-body text-sm text-muted-foreground">
                                        No recent posts available.
                                    </p>
                                ) : (
                                    <div className="mt-5 space-y-4">
                                        {recentPosts.slice(0, 5).map((recentPost) => (
                                            <Link
                                                key={recentPost.id}
                                                href={`/blog/${recentPost.slug}`}
                                                className="flex items-start gap-3"
                                            >
                                                <div className="h-16 w-20 flex-shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                                                    {recentPost.image_url ? (
                                                        <img
                                                            src={recentPost.image_url}
                                                            alt={recentPost.title}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full bg-muted" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="line-clamp-2 font-body text-sm leading-snug text-foreground hover:text-primary">
                                                        {recentPost.title}
                                                    </p>
                                                    {recentPost.published_at && (
                                                        <p className="mt-1 font-body text-xs uppercase tracking-wider text-muted-foreground">
                                                            {formatDate(recentPost.published_at)}
                                                        </p>
                                                    )}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <NewsletterBox />
                        </aside>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
