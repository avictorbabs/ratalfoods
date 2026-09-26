import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import AppLayout from '@/layouts/app-layout';
import type { GalleryPageContent } from '@/types/ratalfoods';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';

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
    pageContent: GalleryPageContent;
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
        description: 'We believe that good food should be good for the planet, too. We are committed to sustainability in everything we do.',
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

function renderMedia(item: GalleryItem, className: string) {
    if (item.media_type === 'video') {
        return <video src={item.media_url} className={className} controls playsInline preload="metadata" />;
    }

    return <img src={item.media_url} alt={item.title ?? 'Gallery media'} className={className} />;
}

export default function Gallery({ items, pageContent }: GalleryPageProps) {
    const sourceItems = items.length > 0 ? items : fallbackItems;
    const gridItems = sourceItems;
    const showcaseImages = [pageContent.showcase_1, pageContent.showcase_2];

    return (
        <AppLayout>
            <Head title="Gallery" />

            <div>
                <section className="relative h-64 overflow-hidden pt-20 sm:h-80 sm:pt-24">
                    <img src={pageContent.hero.image} alt="Nigerian food spread" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="bg-foreground/60 absolute inset-0" />
                    <div className="relative z-10 flex h-full items-center justify-center px-4 text-center">
                        <div>
                            <p className="font-body text-background/70 mb-3 text-xs tracking-[0.3em] uppercase">{pageContent.hero.eyebrow}</p>
                            <h1 className="font-heading text-background text-4xl tracking-tight sm:text-5xl">{pageContent.hero.title}</h1>
                        </div>
                    </div>
                </section>

                <section className="bg-muted/50">
                    <div className="mx-auto max-w-7xl px-4 py-8 pb-16 sm:px-6 lg:px-8">
                        <PageBreadcrumb items={[{ title: 'Home', href: '/' }, { title: 'Gallery' }]} />

                        <div className="border-border mt-6 rounded-md border bg-white p-6 shadow-sm sm:p-8">
                            <h2 className="font-heading text-center text-4xl italic">{pageContent.heading}</h2>

                            {pageContent.featured.length > 0 && (
                                <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                                    {pageContent.featured.map((block, index) => (
                                        <motion.article
                                            key={block.title}
                                            initial={{ opacity: 0, y: 16 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.35, delay: index * 0.1 }}
                                        >
                                            <div className="bg-background overflow-hidden rounded-md shadow-sm">
                                                <img src={showcaseImages[index]} alt={block.title} className="h-56 w-full object-cover sm:h-64" />
                                            </div>
                                            <h3 className="font-heading mt-5 text-center text-[36px] leading-[1.15] italic">{block.title}</h3>
                                            <p className="font-body text-muted-foreground mx-auto mt-4 max-w-xl text-justify text-base leading-relaxed">
                                                {block.description}
                                            </p>
                                        </motion.article>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section className="bg-muted/50 pb-16 sm:pb-20">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        {gridItems.length > 0 ? (
                            <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-3">
                                {gridItems.map((item) => (
                                    <div key={item.id} className="border-background/70 bg-background overflow-hidden border">
                                        {renderMedia(item, 'h-56 w-full object-cover sm:h-64 lg:h-72')}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="border-border bg-card rounded-md border px-6 py-12 text-center">
                                <p className="font-body text-muted-foreground">
                                    Gallery media will appear here as soon as items are added from the admin panel.
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
