import { Link } from '@inertiajs/react';
import { Plus, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import ProductPriceDisplay from '@/components/products/product-price-display';
import { useCart } from '@/lib/cart-store';
import { getProductPricing } from '@/lib/product-pricing';
import type { Product } from '@/types/ratalfoods';

type ProductCardProps = {
    product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
    const { addItem } = useCart();
    const pricing = getProductPricing(product);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group overflow-hidden rounded-xl border border-border bg-white shadow-sm"
        >
            <Link href={`/menu/${product.id}`} className="block">
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {product.image_url ? (
                        <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="h-full w-full bg-muted" />
                    )}
                    <div className="absolute inset-0 bg-foreground/0 transition-colors duration-500 group-hover:bg-foreground/10" />
                    {product.available_for_pickup && (
                        <div className="absolute top-3 left-3 flex items-center gap-1 rounded-sm bg-accent/90 px-2 py-1 text-accent-foreground backdrop-blur-sm">
                            <Clock className="h-3 w-3" />
                            <span className="font-body text-[10px] uppercase tracking-wider">
                                Pickup Ready
                            </span>
                        </div>
                    )}
                </div>
            </Link>

            <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <Link href={`/menu/${product.id}`}>
                            <h3 className="truncate font-heading text-lg font-medium text-foreground transition-colors group-hover:text-primary">
                                {product.name}
                            </h3>
                        </Link>
                        <p className="mt-0.5 font-body text-xs uppercase tracking-wider text-muted-foreground">
                            {product.category}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={(event) => {
                            event.preventDefault();
                            addItem(product, { unitPrice: pricing.effectivePrice });
                        }}
                        className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-border transition-all duration-300 hover:scale-110 hover:border-primary hover:bg-primary hover:text-primary-foreground"
                        aria-label={`Add ${product.name} to cart`}
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>

                {product.description && (
                    <p className="mt-2 line-clamp-1 font-body text-sm leading-relaxed text-muted-foreground">
                        {product.description}
                    </p>
                )}

                <ProductPriceDisplay pricing={pricing} className="mt-3" />
            </div>
        </motion.div>
    );
}
