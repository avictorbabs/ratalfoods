import { Head, router } from '@inertiajs/react';
import { ChevronDown, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import ProductCard from '@/components/products/product-card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { getEffectiveBasePrice } from '@/lib/product-pricing';
import type { Product } from '@/types/ratalfoods';

const PRICE_FILTERS = [
    { value: 'all', label: 'All Prices' },
    { value: 'under-15', label: 'Under $15' },
    { value: '15-25', label: '$15 – $25' },
    { value: 'over-25', label: 'Over $25' },
] as const;

type PriceFilter = (typeof PRICE_FILTERS)[number]['value'];

type MenuProps = {
    products: Product[];
    categories: string[];
    filters: {
        category: string;
    };
};

type MenuDetailItem = {
    name: string;
    description: string;
};

type MenuDetailSection = {
    title: string;
    description: string;
    items?: MenuDetailItem[];
    body?: string;
    cta?: {
        label: string;
        category: string;
    };
};

const MENU_DETAILS_COLUMNS: MenuDetailSection[][] = [
    [
        {
            title: 'Nigerian Classics',
            description:
                'Explore a variety of authentic Nigerian dishes, each crafted with care and tradition.',
            items: [
                {
                    name: 'Jollof Rice and Chicken',
                    description: 'A classic West African dish, bursting with flavour.',
                },
                {
                    name: 'Egusi Soup and Pounded Yam',
                    description:
                        'A hearty combination of rich, savoury soup with soft, pounded yam.',
                },
                {
                    name: 'Ofada Rice and Ayamase Sauce',
                    description:
                        'A traditional meal featuring local rice paired with spicy Ayamase sauce.',
                },
            ],
        },
        {
            title: 'Grilled and Spicy Delights',
            description: 'Indulge in dishes that pack a punch.',
            items: [
                {
                    name: 'Spicy Suya',
                    description:
                        'Grilled, spicy meat skewers seasoned with a flavourful blend of spices.',
                },
                {
                    name: 'Moimoi',
                    description:
                        'A steamed bean pudding made with ground beans, pepper, and spices.',
                },
            ],
        },
    ],
    [
        {
            title: 'All-Time Favourites',
            description: 'Enjoy some of our most loved meals, prepared to perfection.',
            items: [
                {
                    name: 'Fried Rice and Chicken',
                    description: 'A delicious and colourful blend of fried rice and tender chicken.',
                },
                {
                    name: 'Amala and Abula',
                    description:
                        'A popular dish from Nigeria, perfect for those seeking bold flavours.',
                },
            ],
        },
        {
            title: 'Seasonal Specials',
            description: '',
            body: 'At Ratal Foods, we love to celebrate the seasons with special dishes that highlight the freshest ingredients. Our seasonal specials change regularly, offering a unique dining experience with every visit. Be sure to check back often to discover what new flavours we have in store for you!',
            cta: {
                label: 'See Specials',
                category: 'Seasonal Specials',
            },
        },
    ],
];

export default function Menu({ products, categories, filters }: MenuProps) {
    const [search, setSearch] = useState('');
    const [pickupOnly, setPickupOnly] = useState(false);
    const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
    const [menuDetailsOpen, setMenuDetailsOpen] = useState(false);
    const activeCategory = filters.category || 'All';

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

            if (priceFilter === 'under-15' && price >= 15) {
                return false;
            }

            if (priceFilter === '15-25' && (price < 15 || price > 25)) {
                return false;
            }

            if (priceFilter === 'over-25' && price <= 25) {
                return false;
            }

            return true;
        });
    }, [products, activeCategory, pickupOnly, search, priceFilter]);

    const setCategory = (category: string) => {
        router.get(
            '/menu',
            category === 'All' ? {} : { category },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <AppLayout>
            <Head title="Menu" />

            <div>
                <section className="relative h-64 overflow-hidden sm:h-80">
                    <img
                        src="https://media.base44.com/images/public/6a2f8570f73aa7ad1929a1a5/c2233b586_generated_51c27708.png"
                        alt="Nigerian food spread"
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-foreground/60" />
                    <div className="relative z-10 flex h-full items-center justify-center px-4 pt-16 text-center sm:pt-20">
                        <div>
                            <h1 className="font-heading text-4xl tracking-tight text-background sm:text-5xl">
                                Our Menu
                            </h1>
                            <p className="mx-auto mt-3 max-w-md font-body text-sm text-background/70">
                                Authentic Nigerian dishes, crafted with heritage and served fresh
                            </p>
                        </div>
                    </div>
                </section>

                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search dishes..."
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    className="h-10 pl-10 font-body text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-6">
                                <button
                                    type="button"
                                    onClick={() => setPickupOnly(!pickupOnly)}
                                    className={`h-10 w-full rounded-sm border px-3 font-body text-xs uppercase tracking-wider transition-all ${
                                        pickupOnly
                                            ? 'border-accent bg-accent text-accent-foreground'
                                            : 'border-border text-muted-foreground hover:border-foreground/30'
                                    }`}
                                >
                                    Pickup Available
                                </button>

                                <Select
                                    value={priceFilter}
                                    onValueChange={(value) => setPriceFilter(value as PriceFilter)}
                                >
                                    <SelectTrigger className="h-10 w-full font-body text-xs uppercase tracking-wider sm:w-44">
                                        <SelectValue placeholder="Price" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PRICE_FILTERS.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
                                                className="font-body text-sm"
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setMenuDetailsOpen((open) => !open)}
                            aria-expanded={menuDetailsOpen}
                            aria-controls="menu-details-panel"
                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-sm bg-primary px-5 font-body text-xs font-semibold uppercase tracking-wider text-primary-foreground transition-all hover:bg-primary/90 lg:w-auto"
                        >
                            Read Menu Details
                            <ChevronDown
                                className={`h-4 w-4 transition-transform duration-300 ${
                                    menuDetailsOpen ? 'rotate-180' : ''
                                }`}
                            />
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
                                <div className="mt-6 rounded-sm bg-muted px-5 py-8 sm:px-8 sm:py-10">
                                    <div className="grid gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
                                        {MENU_DETAILS_COLUMNS.map((column, columnIndex) => (
                                            <div key={columnIndex} className="space-y-10">
                                                {column.map((section) => (
                                                    <div key={section.title}>
                                                        <h3 className="font-heading text-xl font-semibold text-foreground">
                                                            {section.title}
                                                        </h3>
                                                        {section.description ? (
                                                            <p className="mt-2 font-body text-sm leading-relaxed text-muted-foreground">
                                                                {section.description}
                                                            </p>
                                                        ) : null}
                                                        {section.items ? (
                                                            <ul className="mt-5 space-y-4">
                                                                {section.items.map((item) => (
                                                                    <li key={item.name}>
                                                                        <p className="font-body text-sm font-semibold text-foreground">
                                                                            {item.name}
                                                                        </p>
                                                                        <p className="mt-1 font-body text-sm leading-relaxed text-muted-foreground">
                                                                            {item.description}
                                                                        </p>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : null}
                                                        {section.body ? (
                                                            <p className="mt-3 font-body text-sm leading-relaxed text-muted-foreground">
                                                                {section.body}
                                                            </p>
                                                        ) : null}
                                                        {section.cta ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setCategory(section.cta!.category);
                                                                    setMenuDetailsOpen(false);
                                                                }}
                                                                className="mt-5 inline-flex h-10 items-center justify-center rounded-sm bg-primary px-5 font-body text-xs font-semibold uppercase tracking-wider text-primary-foreground transition-all hover:bg-primary/90"
                                                            >
                                                                {section.cta.label}
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
                                                src="/images/menu/menu-board-snacks-specials.png"
                                                alt="Ratal Foods snacks, drinks, and specials menu board"
                                                className="w-full rounded-sm object-cover"
                                            />
                                            <img
                                                src="/images/menu/menu-board-entrees.png"
                                                alt="Ratal Foods entrees, sides, and soups menu board"
                                                className="w-full rounded-sm object-cover"
                                            />
                                        </div>
                                        <div className="min-h-[22rem] md:h-full">
                                            <img
                                                src="/images/menu/menu-collage.png"
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
                                className={`flex-shrink-0 rounded-sm px-4 py-2 font-body text-xs uppercase tracking-wider transition-all ${
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

                <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
                    {filtered.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-20 text-center"
                        >
                            <p className="font-body text-muted-foreground">
                                No dishes found. Try adjusting your filters.
                            </p>
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
