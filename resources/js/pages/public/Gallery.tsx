import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import AppLayout from '@/layouts/app-layout';

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

type GalleryPageProps = {
    items: GalleryItem[];
};

const fallbackItems: GalleryItem[] = [
    {
        id: -1,
        title: 'Our Ingredients',
        description:
            'We believe that the key to great food is great ingredients. That’s why we only use the freshest, highest-quality ingredients in all of our dishes.',
        media_type: 'image',
        media_url: '/images/about-us/about1.webp',
        sort_order: 1,
        is_featured: true,
        is_active: true,
    },
    {
        id: -2,
        title: 'Our Sustainability',
        description:
            'We believe that good food should be good for the planet, too. We are committed to sustainability in everything we do.',
        media_type: 'image',
        media_url: '/images/about-us/about2.webp',
        sort_order: 2,
        is_featured: true,
        is_active: true,
    },
    {
        id: -3,
        title: null,
        description: null,
        media_type: 'image',
        media_url: '/images/about-us/about1.webp',
        sort_order: 10,
        is_featured: false,
        is_active: true,
    },
    {
        id: -4,
        title: null,
        description: null,
        media_type: 'image',
        media_url: '/images/about-us/about2.webp',
        sort_order: 11,
        is_featured: false,
        is_active: true,
    },
    {
        id: -5,
        title: null,
        description: null,
        media_type: 'image',
        media_url: '/images/about-us/about1.webp',
        sort_order: 12,
        is_featured: false,
        is_active: true,
    },
    {
        id: -6,
        title: null,
        description: null,
        media_type: 'image',
        media_url: '/images/about-us/about2.webp',
        sort_order: 13,
        is_featured: false,
        is_active: true,
    },
];

const featuredContent = [
    {
        title: 'Our Ingredients',
        description:
            'We believe that the key to great food is great ingredients. That’s why we only use the freshest, highest-quality ingredients in all of our dishes. We source our produce from local farmers whenever possible, and we are committed to using organic and non-GMO ingredients whenever possible. We also make everything from scratch in our kitchen, so you can be sure that your meal is fresh and flavorful.',
    },
    {
        title: 'Our Sustainability',
        description:
            'We believe that good food should be good for the planet, too. That’s why we are committed to sustainability in everything we do. We use eco-friendly packaging materials, recycle and compost as much as possible, and source our ingredients from local and sustainable sources. We are always looking for ways to reduce our environmental impact and make a positive difference in our community.',
    },
];

const showcaseImagePaths = ['/images/gallery1.webp', '/images/gallery2.webp'];

function renderMedia(item: GalleryItem, className: string) {
    if (item.media_type === 'video') {
        return (
            <video
                src={item.media_url}
                className={className}
                controls
                playsInline
                preload="metadata"
            />
        );
    }

    return <img src={item.media_url} alt={item.title ?? 'Gallery media'} className={className} />;
}

export default function Gallery({ items }: GalleryPageProps) {
    const sourceItems = items.length > 0 ? items : fallbackItems;
    const featuredItems = sourceItems.filter((item) => item.is_featured).slice(0, 2);
    const fallbackFeatured = sourceItems.slice(0, 2);
    const topItems = featuredItems.length === 2 ? featuredItems : fallbackFeatured;
    const gridItems = sourceItems;

    return (
        <AppLayout>
            <Head title="Gallery" />

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
                                Explore Our Dishes
                            </p>
                            <h1 className="font-heading text-4xl tracking-tight text-background sm:text-5xl">
                                Gallery
                            </h1>
                        </div>
                    </div>
                </section>

                <section className="bg-muted/50">
                    <div className="mx-auto max-w-7xl px-4 py-8 pb-16 sm:px-6 lg:px-8">
                        <PageBreadcrumb
                            items={[
                                { title: 'Home', href: '/' },
                                { title: 'Gallery' },
                            ]}
                        />

                        <h2 className="mt-8 text-center font-heading text-4xl italic">
                            Highlighting Our Culinary Masterpieces
                        </h2>

                        {topItems.length > 0 && (
                            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                                {topItems.map((item, index) => (
                                    <motion.article
                                        key={item.id}
                                        initial={{ opacity: 0, y: 16 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.35, delay: index * 0.1 }}
                                    >
                                        <div className="overflow-hidden rounded-md bg-background shadow-sm">
                                            <img
                                                src={showcaseImagePaths[index] ?? item.media_url}
                                                alt={item.title ?? featuredContent[index]?.title ?? 'Gallery showcase'}
                                                className="h-56 w-full object-cover sm:h-64"
                                            />
                                        </div>
                                        <h3 className="mt-5 text-center font-heading text-[36px] leading-[1.15] italic">
                                            {item.title ?? featuredContent[index]?.title}
                                        </h3>
                                        <p className="mx-auto mt-4 max-w-xl text-justify font-body text-base leading-relaxed text-muted-foreground">
                                            {item.description ?? featuredContent[index]?.description}
                                        </p>
                                    </motion.article>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <section className="bg-muted/50 pb-16 sm:pb-20">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        {gridItems.length > 0 ? (
                            <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-3">
                                {gridItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="overflow-hidden border border-background/70 bg-background"
                                    >
                                        {renderMedia(
                                            item,
                                            'h-56 w-full object-cover sm:h-64 lg:h-72',
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-md border border-border bg-card px-6 py-12 text-center">
                                <p className="font-body text-muted-foreground">
                                    Gallery media will appear here as soon as items are added from
                                    the admin panel.
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
