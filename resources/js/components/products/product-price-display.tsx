import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/price';
import type { ProductPricing } from '@/lib/product-pricing';

type ProductPriceDisplayProps = {
    pricing: ProductPricing;
    amount?: number;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
};

export default function ProductPriceDisplay({
    pricing,
    amount,
    className,
    size = 'md',
}: ProductPriceDisplayProps) {
    const displayAmount = amount ?? pricing.effectivePrice;
    const regularAmount =
        amount !== undefined && pricing.isOnSale
            ? pricing.regularPrice + (amount - pricing.effectivePrice)
            : pricing.regularPrice;

    const sizeClasses = {
        sm: 'text-base',
        md: 'text-base',
        lg: 'text-3xl font-heading',
    };

    if (!pricing.isOnSale) {
        return (
            <p className={cn('font-semibold text-primary', sizeClasses[size], className)}>
                ${formatPrice(displayAmount)}
            </p>
        );
    }

    return (
        <div className={cn('flex flex-wrap items-baseline gap-2', className)}>
            <p className={cn('font-semibold text-primary', sizeClasses[size])}>
                ${formatPrice(displayAmount)}
            </p>
            <p
                className={cn(
                    'font-body text-muted-foreground line-through',
                    size === 'lg' ? 'text-lg' : 'text-sm',
                )}
            >
                ${formatPrice(regularAmount)}
            </p>
        </div>
    );
}
