export type OrderStatusValue =
    | 'pending'
    | 'processing'
    | 'payment_confirmed'
    | 'ready'
    | 'out_for_delivery'
    | 'cancelled'
    | 'completed'
    | 'delivered'
    | 'refunded'
    | 'disputed';

export type StatusOption = {
    value: OrderStatusValue;
    label: string;
};

export const ORDER_STATUS_LABELS: Record<OrderStatusValue, string> = {
    pending: 'Pending',
    processing: 'Preparing',
    payment_confirmed: 'Payment Confirmed',
    ready: 'Ready for Pickup',
    out_for_delivery: 'Out for Delivery',
    cancelled: 'Cancelled',
    completed: 'Completed',
    delivered: 'Delivered',
    refunded: 'Refunded',
    disputed: 'Disputed',
};

export const ORDER_STATUS_STYLES: Record<OrderStatusValue, string> = {
    pending: 'bg-amber-100 text-amber-800',
    processing: 'bg-blue-100 text-blue-800',
    payment_confirmed: 'bg-emerald-100 text-emerald-800',
    ready: 'bg-teal-100 text-teal-800',
    out_for_delivery: 'bg-sky-100 text-sky-800',
    cancelled: 'bg-gray-100 text-gray-600',
    completed: 'bg-primary/15 text-primary',
    delivered: 'bg-violet-100 text-violet-800',
    refunded: 'bg-red-100 text-red-700',
    disputed: 'bg-orange-100 text-orange-800',
};

export function formatOrderStatus(status: string): string {
    return ORDER_STATUS_LABELS[status as OrderStatusValue] ?? status.replace(/_/g, ' ');
}

export function orderStatusClass(status: string): string {
    return ORDER_STATUS_STYLES[status as OrderStatusValue] ?? 'bg-muted text-muted-foreground';
}

export function summarizeProducts(items: { product_name: string; quantity: number }[]): string {
    if (items.length === 0) {
        return '—';
    }

    const first = items[0];
    if (items.length === 1) {
        return first.quantity > 1 ? `${first.product_name} ×${first.quantity}` : first.product_name;
    }

    const extra = items.length - 1;
    return `${first.product_name} +${extra} more`;
}
