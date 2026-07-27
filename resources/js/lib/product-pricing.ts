import { toPrice } from '@/lib/price';
import type { Product } from '@/types/ratalfoods';

export type ProductPricing = {
    regularPrice: number;
    effectivePrice: number;
    isOnSale: boolean;
};

type PricedProduct = Pick<
    Product,
    'price' | 'sale_price' | 'sale_starts_at' | 'sale_ends_at'
>;

export function getProductPricing(
    product: PricedProduct,
    at: Date = new Date(),
): ProductPricing {
    const regularPrice = toPrice(product.price);
    const salePrice =
        product.sale_price !== null && product.sale_price !== undefined && product.sale_price !== ''
            ? toPrice(product.sale_price)
            : null;

    const startsAt = product.sale_starts_at ? new Date(product.sale_starts_at) : null;
    const endsAt = product.sale_ends_at ? new Date(product.sale_ends_at) : null;
    const timestamp = at.getTime();

    const isOnSale =
        salePrice !== null &&
        salePrice > 0 &&
        salePrice < regularPrice &&
        (!startsAt || timestamp >= startsAt.getTime()) &&
        (!endsAt || timestamp <= endsAt.getTime());

    return {
        regularPrice,
        effectivePrice: isOnSale ? salePrice : regularPrice,
        isOnSale,
    };
}

export function getEffectiveBasePrice(product: PricedProduct, at?: Date): number {
    return getProductPricing(product, at).effectivePrice;
}
