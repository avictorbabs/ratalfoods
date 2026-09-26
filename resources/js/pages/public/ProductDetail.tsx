import ProductPriceDisplay from '@/components/products/product-price-display';
import WriteReviewDialog from '@/components/products/write-review-dialog';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import AppLayout from '@/layouts/app-layout';
import { useCart } from '@/lib/cart-store';
import { formatPrice } from '@/lib/price';
import { getProductPricing } from '@/lib/product-pricing';
import { cn } from '@/lib/utils';
import type { Product, ProductReview, ProductReviewStats, ProductVariation } from '@/types/ratalfoods';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, ChevronDown, Clock, Minus, Plus, ShoppingBag, Star, Store } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

type ProductDetailProps = {
    product: Product;
    reviews: ProductReview[];
    reviewStats: ProductReviewStats;
};

type SelectedVariants = Record<string, string>;

function resolveVariations(product: Product): ProductVariation[] {
    if (!product.variations?.length) {
        return [];
    }

    return product.variations.filter(
        (variation) => variation.name.trim() !== '' && variation.options.some((option) => option.label.trim() !== '' && option.value.trim() !== ''),
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
    return Object.fromEntries(variations.map((variation) => [variation.name, variation.options[0]?.value ?? '']));
}

function DetailAccordion({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <div className="border-border border-b">
                <CollapsibleTrigger className="flex w-full items-center justify-between py-4 text-left">
                    <span className="font-body text-foreground text-xs font-semibold tracking-[0.2em] uppercase">{title}</span>
                    <ChevronDown className={cn('text-muted-foreground h-4 w-4 transition-transform', open && 'rotate-180')} />
                </CollapsibleTrigger>
                <CollapsibleContent className="font-body text-muted-foreground pb-5 text-sm leading-relaxed">{children}</CollapsibleContent>
            </div>
        </Collapsible>
    );
}

export default function ProductDetail({ product, reviewStats }: ProductDetailProps) {
    const [quantity, setQuantity] = useState(1);
    const [reviewDialogOpen, setReviewDialogOpen] = useState(
        () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('review') === '1',
    );
    const { addItem } = useCart();
    const roundedAverage = reviewStats.average ? Math.round(reviewStats.average) : 0;

    const variations = useMemo(() => resolveVariations(product), [product]);
    const tags = useMemo(() => resolveTags(product), [product]);
    const [selectedVariants, setSelectedVariants] = useState<SelectedVariants>(() => buildInitialSelections(variations));

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
                        className="font-body text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-1.5 text-sm transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Menu
                    </Link>

                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="border-border bg-muted relative aspect-square overflow-hidden rounded-xl border shadow-sm">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="bg-muted h-full w-full" />
                                )}

                                {product.available_for_pickup && inStock && (
                                    <div className="bg-primary text-primary-foreground absolute top-4 left-4 flex items-center gap-1 rounded-sm px-2.5 py-1">
                                        <Clock className="h-3 w-3" />
                                        <span className="font-body text-[10px] tracking-wider uppercase">Pickup Ready</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="border-border self-start rounded-md border bg-white p-6 shadow-sm sm:p-8 lg:sticky lg:top-24"
                        >
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="border-border bg-muted font-body text-foreground rounded-sm border px-2.5 py-1 text-[10px] tracking-wider uppercase">
                                    {product.category}
                                </span>
                                {!inStock && (
                                    <span className="border-destructive/20 bg-destructive/10 font-body text-destructive inline-flex items-center gap-1 rounded-sm border px-2.5 py-1 text-[10px] tracking-wider uppercase">
                                        <AlertCircle className="h-3 w-3" />
                                        Out of stock
                                    </span>
                                )}
                            </div>

                            <h1 className="font-heading mt-4 text-3xl tracking-tight sm:text-4xl">{product.name}</h1>

                            <p className="font-body text-muted-foreground mt-2 inline-flex items-center gap-1.5 text-sm">
                                <Store className="h-3.5 w-3.5" />
                                Sold by Ratal Foods
                            </p>

                            <div className="mt-4">
                                <ProductPriceDisplay pricing={pricing} amount={unitPrice} size="lg" />
                            </div>

                            <div className="mt-8 space-y-6">
                                {variations.map((variation) => (
                                    <div key={variation.name}>
                                        <p className="font-body text-muted-foreground mb-3 text-xs font-semibold tracking-[0.2em] uppercase">
                                            {variation.name}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {variation.options.map((option) => {
                                                const isSelected = selectedVariants[variation.name] === option.value;

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
                                                            'font-body min-w-12 rounded-md border px-4 py-2 text-sm transition-all',
                                                            isSelected
                                                                ? 'border-primary bg-primary/10 text-foreground'
                                                                : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                                                        )}
                                                    >
                                                        {option.label}
                                                        {option.price_modifier > 0 && (
                                                            <span className="text-muted-foreground ml-1 text-xs">
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
                                    <p className="font-body text-muted-foreground mb-3 text-xs font-semibold tracking-[0.2em] uppercase">Quantity</p>
                                    <div className="border-border flex items-center rounded-md border">
                                        <button
                                            type="button"
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="hover:bg-muted flex h-10 w-10 items-center justify-center transition-colors"
                                            aria-label="Decrease quantity"
                                        >
                                            <Minus className="h-3.5 w-3.5" />
                                        </button>
                                        <span className="font-body w-10 text-center text-sm">{quantity}</span>
                                        <button
                                            type="button"
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="hover:bg-muted flex h-10 w-10 items-center justify-center transition-colors"
                                            aria-label="Increase quantity"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="border-border bg-muted/40 mt-6 flex items-center justify-between rounded-md border px-4 py-3">
                                <span className="font-body text-muted-foreground text-sm">
                                    Subtotal ({quantity} {quantity === 1 ? 'item' : 'items'})
                                </span>
                                <span className="font-body text-foreground text-sm font-semibold">${formatPrice(lineTotal)}</span>
                            </div>

                            {product.available_for_pickup && inStock && (
                                <div className="bg-primary/10 mt-4 flex items-center gap-2 rounded-md p-3">
                                    <Clock className="text-primary h-4 w-4" />
                                    <span className="font-body text-foreground text-sm font-medium">
                                        Store Pickup: {product.preparation_time || 'Ready in 2 Hours'}
                                    </span>
                                </div>
                            )}

                            <Button
                                className="font-body mt-6 h-12 w-full gap-2 text-sm tracking-wide uppercase"
                                onClick={handleAddToCart}
                                disabled={!inStock}
                            >
                                <ShoppingBag className="h-4 w-4" />
                                {inStock ? `Add to Cart — $${formatPrice(lineTotal)}` : 'Out of Stock'}
                            </Button>

                            <div className="border-border mt-8 border-t">
                                <DetailAccordion title="Description" defaultOpen>
                                    {product.description ? <p>{product.description}</p> : <p>No description available for this dish yet.</p>}
                                    {product.ingredients && (
                                        <div className="mt-4">
                                            <p className="font-body text-foreground mb-1 text-xs font-semibold tracking-wider uppercase">
                                                Ingredients
                                            </p>
                                            <p>{product.ingredients}</p>
                                        </div>
                                    )}
                                    {product.serves && (
                                        <p className="mt-4">
                                            <span className="text-foreground font-medium">Serves:</span> {product.serves}
                                        </p>
                                    )}
                                </DetailAccordion>

                                <DetailAccordion title={`Reviews (${reviewStats.count})`}>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: 5 }).map((_, index) => (
                                                <Star
                                                    key={index}
                                                    className={cn(
                                                        'h-4 w-4',
                                                        index < roundedAverage ? 'fill-primary text-primary' : 'text-primary/40 fill-none',
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        {reviewStats.average !== null && (
                                            <span className="font-body text-muted-foreground text-xs">{reviewStats.average.toFixed(1)} out of 5</span>
                                        )}
                                    </div>

                                    {reviewStats.count === 0 && <p className="mt-3">There are no reviews for this product yet.</p>}

                                    <Button
                                        variant="outline"
                                        className="font-body mt-4 h-10 text-xs tracking-wide uppercase"
                                        onClick={() => setReviewDialogOpen(true)}
                                    >
                                        Write a Review
                                    </Button>
                                </DetailAccordion>

                                <DetailAccordion title="Tags">
                                    <div className="flex flex-wrap gap-2">
                                        {tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="border-border bg-muted font-body text-foreground rounded-sm border px-3 py-1 text-xs"
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

            <WriteReviewDialog productId={product.id} productName={product.name} open={reviewDialogOpen} onOpenChange={setReviewDialogOpen} />
        </AppLayout>
    );
}
