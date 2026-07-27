import { Head } from '@inertiajs/react';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import BlogPostCard from '@/components/blog-post-card';
import AppLayout from '@/layouts/app-layout';
import type { BlogPost } from '@/types/ratalfoods';

type BlogProps = {
    posts: BlogPost[];
};

export default function Blog({ posts }: BlogProps) {
    return (
        <AppLayout>
            <Head title="Blog" />

            <div>
                <section className="relative h-64 overflow-hidden pt-20 sm:h-80 sm:pt-24">
                    <img
                        src="https://media.base44.com/images/public/6a2f8570f73aa7ad1929a1a5/c2233b586_generated_51c27708.png"
                        alt="Nigerian food spread"
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-foreground/60" />
                    <div className="relative z-10 flex h-full items-center justify-center px-4 text-center">
                        <div>
                            <p className="mb-3 font-body text-xs uppercase tracking-[0.3em] text-background/70">
                                From Our Kitchen
                            </p>
                            <h1 className="font-heading text-4xl tracking-tight text-background sm:text-5xl">
                                Latest Updates
                            </h1>
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 py-8 pb-14 sm:px-6 sm:pb-16 lg:px-8 lg:pb-20">
                    <PageBreadcrumb
                        items={[
                            { title: 'Home', href: '/' },
                            { title: 'Blog' },
                        ]}
                    />

                    {posts.length === 0 ? (
                        <p className="mt-8 font-body text-muted-foreground">
                            No blog posts yet. Check back soon.
                        </p>
                    ) : (
                        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
                            {posts.map((post) => (
                                <BlogPostCard key={post.id} post={post} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
