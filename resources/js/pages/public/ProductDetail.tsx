import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    ChevronDown,
    Clock,
    Minus,
    Plus,
    ShoppingBag,
    Star,
    Store,
    Truck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useMemo, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import AppLayout from '@/layouts/app-layout';
import { useCart } from '@/lib/cart-store';
import { getProductPricing } from '@/lib/product-pricing';
import ProductPriceDisplay from '@/components/products/product-price-display';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/price';
import type { Product, ProductVariation } from '@/types/ratalfoods';

type ProductDetailProps = {
    product: Product;
};

type SelectedVariants = Record<string, string>;

function resolveVariations(product: Product): ProductVariation[] {
    if (!product.variations?.length) {
        return [];
    }

    return product.variations.filter(
        (variation) =>
            variation.name.trim() !== '' &&
            variation.options.some(
                (option) => option.label.trim() !== '' && option.value.trim() !== '',
            ),
    );
}

function resolveTags(product: Product): string[] {
    if (product.tags && product.tags.length > 0) {
        return product.tags;
    }

    const tags = [product.category];

    if (product.available_for_pickup) {
        tags.push('Pickup Ready');
    }

    return tags;
}

function buildInitialSelections(variations: ProductVariation[]): SelectedVariants {
    return Object.fromEntries(
        variations.map((variation) => [variation.name, variation.options[0]?.value ?? '']),
    );
}

function DetailAccordion({
    title,
    children,
    defaultOpen = false,
}: {
    title: string;
    children: ReactNode;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <div className="border-b border-border">
                <CollapsibleTrigger className="flex w-full items-center justify-between py-4 text-left">
                    <span className="font-body text-xs font-semibold tracking-[0.2em] text-foreground uppercase">
                        {title}
                    </span>
                    <ChevronDown
                        className={cn(
                            'h-4 w-4 text-muted-foreground transition-transform',
                            open && 'rotate-180',
                        )}
                    />
                </CollapsibleTrigger>
                <CollapsibleContent className="pb-5 font-body text-sm leading-relaxed text-muted-foreground">
                    {children}
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}

export default function ProductDetail({ product }: ProductDetailProps) {
    const [quantity, setQuantity] = useState(1);
    const { addItem } = useCart();

    const variations = useMemo(() => resolveVariations(product), [product]);
    const tags = useMemo(() => resolveTags(product), [product]);
    const [selectedVariants, setSelectedVariants] = useState<SelectedVariants>(() =>
        buildInitialSelections(variations),
    );

    const pricing = useMemo(() => getProductPricing(product), [product]);
    const basePrice = pricing.effectivePrice;

    const { unitPrice, variantLabel, variantKey } = useMemo(() => {
        let modifierTotal = 0;
        const labels: string[] = [];
        const keyParts: string[] = [];

        variations.forEach((variation) => {
            const selectedValue = selectedVariants[variation.name];
            const option = variation.options.find((entry) => entry.value === selectedValue);

            if (option) {
                modifierTotal += option.price_modifier;
                labels.push(option.label);
                keyParts.push(`${variation.name}:${option.value}`);
            }
        });

        return {
            unitPrice: basePrice + modifierTotal,
            variantLabel: labels.join(' · '),
            variantKey: keyParts.join('|'),
        };
    }, [basePrice, selectedVariants, variations]);

    const lineTotal = unitPrice * quantity;
    const inStock = product.in_stock ?? true;

    const handleAddToCart = () => {
        if (!inStock) {
            return;
        }

        addItem(product, {
            quantity,
            variantKey,
            variantLabel,
            unitPrice,
        });
    };

    return (
        <AppLayout>
            <Head title={product.name} />

            <div className="pb-20">
                <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 sm:pt-20 lg:px-8">
                    <Link
                        href="/menu"
                        className="mb-8 inline-flex items-center gap-1.5 font-body text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Menu
                    </Link>

                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
                                {product.image_url ? (
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full bg-muted" />
                                )}

                                {product.available_for_pickup && inStock && (
                                    <div className="absolute top-4 left-4 flex items-center gap-1 rounded-sm bg-primary px-2.5 py-1 text-primary-foreground">
                                        <Clock className="h-3 w-3" />
                                        <span className="font-body text-[10px] uppercase tracking-wider">
                                            Pickup Ready
                                        </span>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="self-start lg:sticky lg:top-24"
                        >
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-sm border border-border bg-muted px-2.5 py-1 font-body text-[10px] uppercase tracking-wider text-foreground">
                                    {product.category}
                                </span>
                                {!inStock && (
                                    <span className="inline-flex items-center gap-1 rounded-sm border border-destructive/20 bg-destructive/10 px-2.5 py-1 font-body text-[10px] uppercase tracking-wider text-destructive">
                                        <AlertCircle className="h-3 w-3" />
                                        Out of stock
                                    </span>
                                )}
                            </div>

                            <h1 className="mt-4 font-heading text-3xl tracking-tight sm:text-4xl">
                                {product.name}
                            </h1>

                            <p className="mt-2 inline-flex items-center gap-1.5 font-body text-sm text-muted-foreground">
                                <Store className="h-3.5 w-3.5" />
                                Sold by Ratal Foods
                            </p>

                            <div className="mt-4">
                                <ProductPriceDisplay
                                    pricing={pricing}
                                    amount={unitPrice}
                                    size="lg"
                                />
                            </div>

                            <div className="mt-8 space-y-6">
                                {variations.map((variation) => (
                                    <div key={variation.name}>
                                        <p className="mb-3 font-body text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                                            {variation.name}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {variation.options.map((option) => {
                                                const isSelected =
                                                    selectedVariants[variation.name] === option.value;

                                                return (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedVariants((current) => ({
                                                                ...current,
                                                                [variation.name]: option.value,
                                                            }))
                                                        }
                                                        className={cn(
                                                            'min-w-12 rounded-md border px-4 py-2 font-body text-sm transition-all',
                                                            isSelected
                                                                ? 'border-primary bg-primary/10 text-foreground'
                                                                : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                                                        )}
                                                    >
                                                        {option.label}
                                                        {option.price_modifier > 0 && (
                                                            <span className="ml-1 text-xs text-muted-foreground">
                                                                +${formatPrice(option.price_modifier)}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                <div>
                                    <p className="mb-3 font-body text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                                        Quantity
                                    </p>
                                    <div className="flex items-center rounded-md border border-border">
                                        <button
                                            type="button"
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-muted"
                                            aria-label="Decrease quantity"
                                        >
                                            <Minus className="h-3.5 w-3.5" />
                                        </button>
                                        <span className="w-10 text-center font-body text-sm">
                                            {quantity}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-muted"
                                            aria-label="Increase quantity"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between rounded-md border border-border bg-muted/40 px-4 py-3">
                                <span className="font-body text-sm text-muted-foreground">
                                    Subtotal ({quantity} {quantity === 1 ? 'item' : 'items'})
                                </span>
                                <span className="font-body text-sm font-semibold text-foreground">
                                    ${formatPrice(lineTotal)}
                                </span>
                            </div>

                            {product.available_for_pickup && inStock && (
                                <div className="mt-4 flex items-center gap-2 rounded-md bg-primary/10 p-3">
                                    <Clock className="h-4 w-4 text-primary" />
                                    <span className="font-body text-sm font-medium text-foreground">
                                        Store Pickup: {product.preparation_time || 'Ready in 2 Hours'}
                                    </span>
                                </div>
                            )}

                            <Button
                                className="mt-6 h-12 w-full gap-2 font-body text-sm tracking-wide uppercase"
                                onClick={handleAddToCart}
                                disabled={!inStock}
                            >
                                <ShoppingBag className="h-4 w-4" />
                                {inStock
                                    ? `Add to Cart — $${formatPrice(lineTotal)}`
                                    : 'Out of Stock'}
                            </Button>

                            <div className="mt-4 text-center">
                                <Link
                                    href="/contact?delivery=true"
                                    className="inline-flex items-center gap-1.5 font-body text-xs text-muted-foreground transition-colors hover:text-primary"
                                >
                                    <Truck className="h-3.5 w-3.5" />
                                    Need delivery? Request a quote for local drop-off
                                </Link>
                            </div>

                            <div className="mt-8 border-t border-border">
                                <DetailAccordion title="Description" defaultOpen>
                                    {product.description ? (
                                        <p>{product.description}</p>
                                    ) : (
                                        <p>No description available for this dish yet.</p>
                                    )}
                                    {product.ingredients && (
                                        <div className="mt-4">
                                            <p className="mb-1 font-body text-xs font-semibold tracking-wider text-foreground uppercase">
                                                Ingredients
                                            </p>
                                            <p>{product.ingredients}</p>
                                        </div>
                                    )}
                                    {product.serves && (
                                        <p className="mt-4">
                                            <span className="font-medium text-foreground">Serves:</span>{' '}
                                            {product.serves}
                                        </p>
                                    )}
                                </DetailAccordion>

                                <DetailAccordion title="Reviews (0)">
                                    <div className="flex items-center gap-1 text-primary/40">
                                        {Array.from({ length: 5 }).map((_, index) => (
                                            <Star key={index} className="h-4 w-4 fill-current" />
                                        ))}
                                    </div>
                                    <p className="mt-3">There are no reviews for this product yet.</p>
                                    <Button
                                        variant="outline"
                                        className="mt-4 h-10 font-body text-xs tracking-wide uppercase"
                                        asChild
                                    >
                                        <Link href="/contact">Write a Review</Link>
                                    </Button>
                                </DetailAccordion>

                                <DetailAccordion title="Tags">
                                    <div className="flex flex-wrap gap-2">
                                        {tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="rounded-sm border border-border bg-muted px-3 py-1 font-body text-xs text-foreground"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </DetailAccordion>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
