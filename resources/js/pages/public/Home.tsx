import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowRight, ChevronLeft, ChevronRight, CircleHelp, CreditCard, Tag, Truck } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import ProductCard from '@/components/products/product-card';
import BlogPostCard from '@/components/blog-post-card';
import { PublicImage } from '@/components/public-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BlogPost, HomePageContent, Product, ProductCategoryItem } from '@/types/ratalfoods';

const CATEGORY_ITEMS_PER_SLIDE = 5;

const perkIcons = [Truck, Tag, CircleHelp, CreditCard] as const;

function StorePerksBar({ perks }: { perks: HomePageContent['perks'] }) {
    return (
        <div className="overflow-hidden rounded-lg border border-border bg-white lg:flex">
            {perks.map((perk, index) => {
                const Icon = perkIcons[index] ?? Truck;

                return (
                    <div
                        key={`${perk.title}-${index}`}
                        className={`flex flex-1 items-center gap-4 px-6 py-5 sm:px-5 lg:px-6 lg:py-6 ${
                            index > 0 ? 'border-t border-border lg:border-t-0 lg:border-l' : ''
                        }`}
                    >
                        <Icon className="h-8 w-8 shrink-0 text-foreground" strokeWidth={1.5} />
                        <div>
                            <p className="font-body text-sm font-semibold text-foreground">{perk.title}</p>
                            <p className="mt-0.5 font-body text-xs text-muted-foreground">
                                {perk.description}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

type HomeProps = {
    featuredProducts: Product[];
    categories: ProductCategoryItem[];
    latestPosts: BlogPost[];
    pageContent: HomePageContent;
};

function categoryImageName(name: string): string {
    return name.toLowerCase().replace(/\s+&\s+/g, '-').replace(/\s+/g, '-');
}

function CategoryCarousel({ categories }: { categories: ProductCategoryItem[] }) {
    const [activeSlide, setActiveSlide] = useState(0);

    const slides = useMemo(() => {
        const chunks: ProductCategoryItem[][] = [];

        for (let index = 0; index < categories.length; index += CATEGORY_ITEMS_PER_SLIDE) {
            chunks.push(categories.slice(index, index + CATEGORY_ITEMS_PER_SLIDE));
        }

        return chunks;
    }, [categories]);

    const totalSlides = slides.length;

    const goToSlide = (index: number) => {
        if (totalSlides === 0) {
            return;
        }

        setActiveSlide(((index % totalSlides) + totalSlides) % totalSlides);
    };

    if (categories.length === 0) {
        return null;
    }

    const slideCategories = slides[activeSlide] ?? [];

    return (
        <div className="flex items-center gap-3 sm:gap-4">
            <button
                type="button"
                onClick={() => goToSlide(activeSlide - 1)}
                disabled={totalSlides <= 1}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-white text-foreground transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-40"
                aria-label="Previous categories"
            >
                <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSlide}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -24 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5 lg:gap-6"
                    >
                        {slideCategories.map((category) => (
                            <Link
                                key={category.name}
                                href={`/menu?category=${encodeURIComponent(category.name)}`}
                                className="group flex flex-col items-center text-center"
                            >
                                <div className="aspect-square w-full overflow-hidden rounded-xl border border-border bg-muted shadow-sm transition-shadow group-hover:shadow-md">
                                    {category.image_url ? (
                                        <img
                                            src={category.image_url}
                                            alt={category.name}
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    ) : (
                                        <PublicImage
                                            directory="/images/categories"
                                            name={categoryImageName(category.name)}
                                            alt={category.name}
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    )}
                                </div>
                                <p className="mt-3 line-clamp-2 font-body text-xs leading-snug text-foreground sm:text-sm">
                                    {category.name}
                                </p>
                            </Link>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>

            <button
                type="button"
                onClick={() => goToSlide(activeSlide + 1)}
                disabled={totalSlides <= 1}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-white text-foreground transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-40"
                aria-label="Next categories"
            >
                <ChevronRight className="h-5 w-5" />
            </button>
        </div>
    );
}

function WhyChooseUsCarousel({ slides }: { slides: HomePageContent['why']['slides'] }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const item = slides[activeIndex];
    const imageFirst = activeIndex % 2 === 0;

    const goToSlide = (index: number) => {
        const total = slides.length;
        if (total === 0) {
            return;
        }

        setActiveIndex(((index % total) + total) % total);
    };

    useEffect(() => {
        if (isPaused || slides.length === 0) {
            return;
        }

        const interval = window.setInterval(() => {
            setActiveIndex((current) => (current + 1) % slides.length);
        }, 6000);

        return () => window.clearInterval(interval);
    }, [isPaused, slides.length]);

    if (!item) {
        return null;
    }

    return (
        <div onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
            <div className="overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeIndex}
                        initial={{ opacity: 0, x: 32 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -32 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16"
                    >
                        <div className={imageFirst ? 'lg:order-1' : 'lg:order-2'}>
                            <div className="aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
                                <img
                                    src={item.image}
                                    alt={item.image_alt}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        </div>

                        <div className={imageFirst ? 'lg:order-2' : 'lg:order-1'}>
                            <p className="mb-3 font-body text-sm font-semibold tracking-[0.2em] text-primary">
                                {String(activeIndex + 1).padStart(2, '0')}
                            </p>
                            <h3 className="font-heading text-[30px] leading-tight tracking-tight">
                                {item.title}
                            </h3>
                            <div className="mt-4 mb-6 h-px w-16 bg-border" />
                            <p className="text-justify font-body text-[16px] leading-relaxed text-muted-foreground">
                                {item.description}
                            </p>
                            <Button
                                size="lg"
                                className="mt-6 h-11 px-7 font-body text-sm tracking-wide uppercase"
                                asChild
                            >
                                <Link href={item.cta_href}>{item.cta_label}</Link>
                            </Button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="mt-10 flex items-center justify-center gap-4 sm:gap-6">
                <button
                    type="button"
                    onClick={() => goToSlide(activeIndex - 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-foreground transition-colors hover:border-primary hover:text-primary"
                    aria-label="Previous slide"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-2">
                    {slides.map((slide, index) => (
                        <button
                            key={`${slide.title}-${index}`}
                            type="button"
                            onClick={() => goToSlide(index)}
                            className={`h-2.5 rounded-full transition-all ${
                                index === activeIndex
                                    ? 'w-8 bg-primary'
                                    : 'w-2.5 bg-border hover:bg-primary/50'
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                            aria-current={index === activeIndex ? 'true' : undefined}
                        />
                    ))}
                </div>

                <button
                    type="button"
                    onClick={() => goToSlide(activeIndex + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-foreground transition-colors hover:border-primary hover:text-primary"
                    aria-label="Next slide"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}

function NewsletterSignup({ copy }: { copy: HomePageContent['newsletter'] }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        post('/newsletter', {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <div className="rounded-xl border border-border bg-white p-8 shadow-sm sm:p-10">
            <p className="font-body text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {copy.eyebrow}
            </p>
            <h3 className="mt-2 font-heading text-2xl tracking-tight sm:text-3xl">
                {copy.heading}
            </h3>
            <p className="mt-3 font-body text-sm leading-relaxed text-muted-foreground">
                {copy.body}
            </p>

            <form onSubmit={submit} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
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
                    {errors.name && (
                        <p className="mt-1 text-sm text-destructive">{errors.name}</p>
                    )}
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
                    {errors.email && (
                        <p className="mt-1 text-sm text-destructive">{errors.email}</p>
                    )}
                </div>

                <Button
                    type="submit"
                    disabled={processing}
                    className="h-11 w-full font-body text-sm tracking-wide uppercase md:col-span-2"
                >
                    {processing ? 'Subscribing...' : copy.button_label}
                </Button>
            </form>
        </div>
    );
}

export default function Home({ featuredProducts, categories, latestPosts, pageContent }: HomeProps) {
    const { hero, perks, categories: categoryCopy, featured, why, cta, newsletter, blog } = pageContent;

    return (
        <AppLayout>
            <Head title="Home" />

            <section className="relative flex h-screen max-h-[900px] min-h-[600px] items-center">
                <div className="absolute inset-0">
                    <img
                        src={hero.image}
                        alt="Nigerian jollof rice with grilled chicken"
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/15" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/20" />
                </div>

                <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl"
                    >
                        <p className="mb-4 font-body text-xs uppercase tracking-[0.3em] text-white/80">
                            {hero.eyebrow}
                        </p>
                        <h1 className="font-heading text-4xl leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                            {hero.title}
                            <br />
                            <span className="sm:whitespace-nowrap">
                                {hero.title_line_2}
                            </span>
                        </h1>
                        <p className="mt-6 font-body text-base leading-relaxed text-white sm:text-lg sm:whitespace-nowrap">
                            {hero.body}
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Button
                                size="lg"
                                className="group h-12 px-8 font-body text-sm tracking-wide uppercase"
                                asChild
                            >
                                <Link href={hero.cta_primary_href ?? '/menu'}>
                                    {hero.cta_primary_label}
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </Button>
                            <Button
                                size="lg"
                                className="h-12 border-white bg-white px-8 font-body text-sm tracking-wide text-foreground uppercase hover:bg-white/90"
                                asChild
                            >
                                <Link href={hero.cta_secondary_href ?? '/about'}>{hero.cta_secondary_label}</Link>
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            <section className="py-10 sm:py-14" style={{ backgroundColor: '#F3F1EB' }}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <StorePerksBar perks={perks} />
                </div>
            </section>

            <section className="bg-white py-10 sm:py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-8 flex items-end justify-between sm:mb-10">
                        <div>
                            <p className="mb-2 font-body text-xs uppercase tracking-[0.3em] text-muted-foreground">
                                {categoryCopy.eyebrow}
                            </p>
                            <h2 className="font-heading text-2xl tracking-tight sm:text-3xl">
                                {categoryCopy.heading}
                            </h2>
                        </div>
                        <Link
                            href="/menu?category=All"
                            className="hidden items-center gap-1.5 font-body text-sm text-primary hover:underline sm:flex"
                        >
                            {categoryCopy.link_label}
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                    <CategoryCarousel categories={categories} />
                    <div className="mt-8 text-center sm:hidden">
                        <Link
                            href="/menu?category=All"
                            className="inline-flex items-center gap-1.5 font-body text-sm text-primary"
                        >
                            {categoryCopy.link_label}
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            </section>

            <section className="bg-secondary/50 py-10 sm:py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-12 flex items-end justify-between">
                        <div>
                            <p className="mb-2 font-body text-xs uppercase tracking-[0.3em] text-muted-foreground">
                                {featured.eyebrow}
                            </p>
                            <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">
                                {featured.heading}
                            </h2>
                        </div>
                        <Link
                            href="/menu"
                            className="hidden items-center gap-1.5 font-body text-sm text-primary hover:underline sm:flex"
                        >
                            {featured.link_label}
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>

                    {featuredProducts.length === 0 ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
                            {[0, 1, 2, 3].map((index) => (
                                <div
                                    key={index}
                                    className="animate-pulse overflow-hidden rounded-xl border border-border bg-white shadow-sm"
                                >
                                    <div className="aspect-[4/3] bg-muted" />
                                    <div className="space-y-2 p-5">
                                        <div className="h-4 w-2/3 rounded bg-muted" />
                                        <div className="h-3 w-1/3 rounded bg-muted" />
                                        <div className="h-3 w-full rounded bg-muted" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
                            {featuredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}

                    <div className="mt-8 text-center sm:hidden">
                        <Link
                            href="/menu"
                            className="inline-flex items-center gap-1.5 font-body text-sm text-primary"
                        >
                            {featured.mobile_link_label}
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            </section>

            <section className="bg-white py-10 sm:py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-16 text-center">
                        <p className="mb-2 font-body text-xs uppercase tracking-[0.3em] text-muted-foreground">
                            {why.eyebrow}
                        </p>
                        <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">
                            {why.heading}
                        </h2>
                    </div>

                    <WhyChooseUsCarousel slides={why.slides} />
                </div>
            </section>

            <section className="py-10 sm:py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
                        <div className="text-center lg:text-left">
                            <h2 className="font-heading text-[36px] tracking-tight">
                                {cta.heading}
                            </h2>
                            <p className="mx-auto mt-6 max-w-lg font-body leading-relaxed text-muted-foreground lg:mx-0">
                                {cta.body}
                            </p>
                            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                                <Button
                                    size="lg"
                                    className="h-12 px-8 font-body text-sm tracking-wide uppercase"
                                    asChild
                                >
                                    <Link href={cta.primary_href}>{cta.primary_label}</Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="h-12 px-8 font-body text-sm tracking-wide uppercase"
                                    asChild
                                >
                                    <Link href={cta.secondary_href}>{cta.secondary_label}</Link>
                                </Button>
                            </div>
                        </div>

                        <NewsletterSignup copy={newsletter} />
                    </div>
                </div>
            </section>

            {latestPosts.length > 0 && (
                <section className="bg-white py-10 sm:py-14">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-12 flex items-end justify-between">
                            <div>
                                <p className="mb-2 font-body text-xs uppercase tracking-[0.3em] text-muted-foreground">
                                    {blog.eyebrow}
                                </p>
                                <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">
                                    {blog.heading}
                                </h2>
                            </div>
                            <Link
                                href="/blog"
                                className="hidden items-center gap-1.5 font-body text-sm text-primary hover:underline sm:flex"
                            >
                                {blog.link_label}
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
                            {latestPosts.map((post) => (
                                <BlogPostCard key={post.id} post={post} />
                            ))}
                        </div>

                        <div className="mt-8 text-center sm:hidden">
                            <Link
                                href="/blog"
                                className="inline-flex items-center gap-1.5 font-body text-sm text-primary"
                            >
                                {blog.link_label}
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    </div>
                </section>
            )}
        </AppLayout>
    );
}
