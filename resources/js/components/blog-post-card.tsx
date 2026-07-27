import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import type { BlogPost } from '@/types/ratalfoods';

type BlogPostCardProps = {
    post: BlogPost;
};

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export default function BlogPostCard({ post }: BlogPostCardProps) {
    return (
        <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm"
        >
            <Link href={`/blog/${post.slug}`} className="block">
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {post.image_url ? (
                        <img
                            src={post.image_url}
                            alt={post.title}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="h-full w-full bg-muted" />
                    )}
                </div>
            </Link>

            <div className="p-5">
                {post.published_at && (
                    <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">
                        {formatDate(post.published_at)}
                    </p>
                )}
                <Link href={`/blog/${post.slug}`}>
                    <h3 className="mt-2 line-clamp-1 font-heading text-lg font-medium text-foreground transition-colors group-hover:text-primary">
                        {post.title}
                    </h3>
                </Link>
                {post.excerpt && (
                    <p className="mt-2 line-clamp-2 font-body text-sm leading-relaxed text-muted-foreground">
                        {post.excerpt}
                    </p>
                )}
                <Link
                    href={`/blog/${post.slug}`}
                    className="mt-3 inline-flex font-body text-sm text-primary hover:underline"
                >
                    Read more
                </Link>
            </div>
        </motion.article>
    );
}
