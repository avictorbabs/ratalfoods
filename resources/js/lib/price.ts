export function toPrice(price: string | number): number {
    return typeof price === 'number' ? price : parseFloat(price);
}

export function formatPrice(price: string | number): string {
    return toPrice(price).toFixed(2);
}
