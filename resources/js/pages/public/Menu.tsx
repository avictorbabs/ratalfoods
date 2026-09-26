import ProductCard from '@/components/products/product-card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import AppLayout from '@/layouts/app-layout';
import { getEffectiveBasePrice } from '@/lib/product-pricing';
import type { MenuPageContent, Product } from '@/types/ratalfoods';
import { Head, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

type MenuProps = {
    products: Product[];
    categories: string[];
    filters: {
        category: string;
    };
    pageContent: MenuPageContent;
};

export default function Menu({ products, categories, filters, pageContent }: MenuProps) {
    const [search, setSearch] = useState('');
    const [pickupOnly, setPickupOnly] = useState(false);
    const [menuDetailsOpen, setMenuDetailsOpen] = useState(false);
    const activeCategory = filters.category || 'All';
    const detailColumns = [pageContent.details.slice(0, 2), pageContent.details.slice(2, 4)];

    const priceBounds = useMemo(() => {
        if (products.length === 0) {
            return { min: 0, max: 100 };
        }

        const prices = products.map((product) => getEffectiveBasePrice(product));
        const min = Math.floor(Math.min(...prices));
        const max = Math.ceil(Math.max(...prices));

        return { min, max: max > min ? max : min + 1 };
    }, [products]);

    const [priceRange, setPriceRange] = useState<[number, number]>([priceBounds.min, priceBounds.max]);

    const filtered = useMemo(() => {
        return products.filter((product) => {
            if (activeCategory !== 'All' && product.category !== activeCategory) {
                return false;
            }

            if (pickupOnly && !product.available_for_pickup) {
                return false;
            }

            if (search && !product.name.toLowerCase().includes(search.toLowerCase())) {
                return false;
            }

            const price = getEffectiveBasePrice(product);

            if (price < priceRange[0] || price > priceRange[1]) {
                return false;
            }

            return true;
        });
    }, [products, activeCategory, pickupOnly, search, priceRange]);

    const setCategory = (category: string) => {
        router.get('/menu', category === 'All' ? {} : { category }, { preserveState: true, preserveScroll: true });
    };

    return (
        <AppLayout>
            <Head title="Menu" />

            <div>
                <section className="relative h-64 overflow-hidden sm:h-80">
                    <img src={pageContent.hero.image} alt="Nigerian food spread" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="bg-foreground/60 absolute inset-0" />
                    <div className="relative z-10 flex h-full items-center justify-center px-4 pt-16 text-center sm:pt-20">
                        <div>
                            <h1 className="font-heading text-background text-4xl tracking-tight sm:text-5xl">{pageContent.hero.title}</h1>
                            <p className="font-body text-background/70 mx-auto mt-3 max-w-md text-sm">{pageContent.hero.body}</p>
                        </div>
                    </div>
                </section>

                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="border-border rounded-md border bg-white p-6 shadow-sm sm:p-8">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
                                <div className="relative w-full sm:w-72">
                                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                    <Input
                                        placeholder="Search dishes..."
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        className="font-body h-10 pl-10 text-sm"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setPickupOnly(!pickupOnly)}
                                    className={`font-body h-10 w-full shrink-0 rounded-sm border px-3 text-xs tracking-wider whitespace-nowrap uppercase transition-all sm:w-auto ${
                                        pickupOnly
                                            ? 'border-accent bg-accent text-accent-foreground'
                                            : 'border-border text-muted-foreground hover:border-foreground/30'
                                    }`}
                                >
                                    Pickup Available
                                </button>

                                <div className="w-full sm:w-48">
                                    <div className="font-body text-muted-foreground flex items-center justify-between text-xs tracking-wider uppercase">
                                        <span>Price range</span>
                                        <span className="text-foreground font-medium normal-case">
                                            ${priceRange[0]} – ${priceRange[1]}
                                        </span>
                                    </div>
                                    <Slider
                                        className="mt-3"
                                        min={priceBounds.min}
                                        max={priceBounds.max}
                                        step={1}
                                        minStepsBetweenThumbs={1}
                                        value={priceRange}
                                        onValueChange={(value) => setPriceRange(value as [number, number])}
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setMenuDetailsOpen((open) => !open)}
                                aria-expanded={menuDetailsOpen}
                                aria-controls="menu-details-panel"
                                className="bg-primary font-body text-primary-foreground hover:bg-primary/90 inline-flex h-10 w-full items-center justify-center gap-2 rounded-sm px-5 text-xs font-semibold tracking-wider uppercase transition-all lg:w-auto"
                            >
                                {pageContent.details_button_label}
                                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${menuDetailsOpen ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        <AnimatePresence initial={false}>
                            {menuDetailsOpen && (
                                <motion.div
                                    id="menu-details-panel"
                                    key="menu-details"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.28, ease: 'easeInOut' }}
                                    className="overflow-hidden"
                                >
                                    <div className="bg-muted mt-6 rounded-sm px-5 py-8 sm:px-8 sm:py-10">
                                        <div className="grid gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
                                            {detailColumns.map((column, columnIndex) => (
                                                <div key={columnIndex} className="space-y-10">
                                                    {column.map((section) => (
                                                        <div key={section.title}>
                                                            <h3 className="font-heading text-foreground text-xl font-semibold">{section.title}</h3>
                                                            {section.description ? (
                                                                <p className="font-body text-muted-foreground mt-2 text-sm leading-relaxed">
                                                                    {section.description}
                                                                </p>
                                                            ) : null}
                                                            {(section.items ?? []).length > 0 ? (
                                                                <ul className="mt-5 space-y-4">
                                                                    {(section.items ?? []).map((item) => (
                                                                        <li key={item.name}>
                                                                            <p className="font-body text-foreground text-sm font-semibold">
                                                                                {item.name}
                                                                            </p>
                                                                            <p className="font-body text-muted-foreground mt-1 text-sm leading-relaxed">
                                                                                {item.description}
                                                                            </p>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : null}
                                                            {section.cta_label ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setCategory(section.cta_category);
                                                                        setMenuDetailsOpen(false);
                                                                    }}
                                                                    className="bg-primary font-body text-primary-foreground hover:bg-primary/90 mt-5 inline-flex h-10 items-center justify-center rounded-sm px-5 text-xs font-semibold tracking-wider uppercase transition-all"
                                                                >
                                                                    {section.cta_label}
                                                                </button>
                                                            ) : null}
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-10 grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 md:gap-5">
                                            <div className="flex min-h-0 flex-col gap-4 md:gap-5">
                                                <img
                                                    src={pageContent.board_left_top}
                                                    alt="Ratal Foods snacks, drinks, and specials menu board"
                                                    className="w-full rounded-sm object-cover"
                                                />
                                                <img
                                                    src={pageContent.board_left_bottom}
                                                    alt="Ratal Foods entrees, sides, and soups menu board"
                                                    className="w-full rounded-sm object-cover"
                                                />
                                            </div>
                                            <div className="min-h-[22rem] md:h-full">
                                                <img
                                                    src={pageContent.board_right}
                                                    alt="Ratal Foods dish collage"
                                                    className="h-full w-full rounded-sm object-cover object-center"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="scrollbar-hide -mx-4 mt-6 flex gap-1 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() => setCategory(category)}
                                    className={`font-body flex-shrink-0 rounded-sm px-4 py-2 text-xs tracking-wider uppercase transition-all ${
                                        activeCategory === category
                                            ? 'bg-foreground text-background'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
                    {filtered.length === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
                            <p className="font-body text-muted-foreground">No dishes found. Try adjusting your filters.</p>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
                            {filtered.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
