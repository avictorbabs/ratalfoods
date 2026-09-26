import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCart, type CartItem } from '@/lib/cart-store';
import { getJson } from '@/lib/http';
import { formatOrderStatus, orderStatusClass } from '@/lib/order-status';
import { formatPrice } from '@/lib/price';
import { router } from '@inertiajs/react';
import { Eye, RotateCcw } from 'lucide-react';
import { useState } from 'react';

export type UserOrder = {
    id: number;
    order_number: string;
    total: string;
    subtotal: string;
    discount?: string;
    coupon_code?: string | null;
    tracking_url?: string | null;
    tax: string;
    delivery_fee: string;
    delivery_zone: string | null;
    status: string;
    payment_status: string;
    payment_method: string | null;
    collection_method: string;
    pickup_time: string | null;
    delivery_address: string | null;
    delivery_time_preference: string | null;
    notes: string | null;
    created_at: string;
    items: { id: number; product_name: string; quantity: number; price: string }[];
};

export type UserBooking = {
    id: number;
    booking_number: string;
    booking_type: string;
    date: string;
    time: string;
    guests: number;
    occasion: string | null;
    notes: string | null;
    status: string;
};

const BOOKING_STATUS_STYLES: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    confirmed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-gray-100 text-gray-600',
    completed: 'bg-primary/15 text-primary',
};

const BOOKING_TYPES: Record<string, string> = {
    dine_in: 'Dine In',
    catering: 'Catering',
    private_event: 'Private Event',
};

const badge = 'inline-flex rounded-sm px-2 py-1 font-body text-xs font-medium uppercase tracking-wider';

function formatDate(value: string, withTime = false): string {
    const date = new Date(value);

    return date.toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...(withTime ? { hour: 'numeric', minute: '2-digit' } : { timeZone: 'UTC' }),
    });
}

function partySize(booking: UserBooking): string | null {
    if (booking.booking_type === 'catering') {
        return null;
    }

    const unit = booking.booking_type === 'dine_in' ? 'table' : 'guest';

    return `${booking.guests} ${unit}${booking.guests > 1 ? 's' : ''}`;
}

function paymentLabel(order: UserOrder): string {
    const method = order.payment_method === 'stripe' ? 'Online (Stripe)' : 'Pay in person';

    return `${method} · ${order.payment_status}`;
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
    if (!value) {
        return null;
    }

    return (
        <div className="font-body flex justify-between gap-6 py-1.5 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-right">{value}</span>
        </div>
    );
}

export function OrderList({ orders, empty }: { orders: UserOrder[]; empty: React.ReactNode }) {
    const [selected, setSelected] = useState<UserOrder | null>(null);
    const { addLines } = useCart();
    const [reorderingId, setReorderingId] = useState<number | null>(null);
    const [reorderNote, setReorderNote] = useState<string | null>(null);

    const reorder = async (order: UserOrder) => {
        setReorderingId(order.id);
        setReorderNote(null);

        const response = await getJson<{ items: CartItem[]; unavailable: string[] }>(`/dashboard/orders/${order.id}/reorder`);
        setReorderingId(null);

        if (!response.ok || response.data.items.length === 0) {
            setReorderNote('Sorry, the items from this order are no longer available.');

            return;
        }

        addLines(response.data.items);
        router.visit('/checkout');
    };

    if (orders.length === 0) {
        return <div className="px-6 py-8">{empty}</div>;
    }

    return (
        <>
            {reorderNote && <p className="font-body text-destructive px-6 py-3 text-sm">{reorderNote}</p>}
            <div className="divide-border divide-y">
                {orders.map((order) => (
                    <div key={order.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="font-body text-sm font-medium">{order.order_number}</p>
                            <p className="font-body text-muted-foreground text-xs">{formatDate(order.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className={`${badge} ${orderStatusClass(order.status)}`}>{formatOrderStatus(order.status)}</span>
                            <span className="font-body text-primary text-sm font-semibold">${formatPrice(order.total)}</span>
                            <Button variant="outline" size="sm" onClick={() => setSelected(order)}>
                                <Eye className="h-4 w-4" />
                                View
                            </Button>
                            <Button variant="default" size="sm" disabled={reorderingId === order.id} onClick={() => void reorder(order)}>
                                <RotateCcw className="h-4 w-4" />
                                {reorderingId === order.id ? 'Adding…' : 'Order again'}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    {selected && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="font-heading">{selected.order_number}</DialogTitle>
                                <DialogDescription>Placed {formatDate(selected.created_at, true)}</DialogDescription>
                            </DialogHeader>

                            <span className={`${badge} ${orderStatusClass(selected.status)} w-fit`}>{formatOrderStatus(selected.status)}</span>

                            <div className="divide-border border-border divide-y rounded-md border px-4">
                                <Row label="Collection" value={selected.collection_method === 'pickup' ? 'Store pickup' : 'Delivery request'} />
                                <Row
                                    label={selected.collection_method === 'pickup' ? 'Pickup time' : 'Delivery time'}
                                    value={selected.pickup_time ?? selected.delivery_time_preference}
                                />
                                <Row label="Delivery address" value={selected.delivery_address} />
                                <Row label="Payment" value={paymentLabel(selected)} />
                            </div>

                            <div>
                                <p className="font-body text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">Items</p>
                                <div className="divide-border border-border divide-y rounded-md border px-4">
                                    {selected.items.map((item) => (
                                        <div key={item.id} className="font-body flex justify-between gap-4 py-2 text-sm">
                                            <span>
                                                {item.product_name} <span className="text-muted-foreground">×{item.quantity}</span>
                                            </span>
                                            <span>${formatPrice(Number(item.price) * item.quantity)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="font-body space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>${formatPrice(selected.subtotal)}</span>
                                </div>
                                {Number(selected.discount) > 0 && (
                                    <div className="flex justify-between text-emerald-700">
                                        <span>Discount{selected.coupon_code ? ` (${selected.coupon_code})` : ''}</span>
                                        <span>-${formatPrice(selected.discount ?? 0)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tax</span>
                                    <span>${formatPrice(selected.tax)}</span>
                                </div>
                                {Number(selected.delivery_fee) > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Delivery{selected.delivery_zone ? ` (${selected.delivery_zone})` : ''}
                                        </span>
                                        <span>${formatPrice(selected.delivery_fee)}</span>
                                    </div>
                                )}
                                <div className="border-border flex justify-between border-t pt-2 text-base font-semibold">
                                    <span>Total</span>
                                    <span>${formatPrice(selected.total)}</span>
                                </div>
                            </div>

                            {selected.notes && <p className="font-body text-muted-foreground text-sm">Notes: {selected.notes}</p>}
                            {selected.tracking_url && (
                                <Button asChild variant="outline" className="w-full">
                                    <a href={selected.tracking_url}>Track order</a>
                                </Button>
                            )}
                            <Button className="w-full" disabled={reorderingId === selected.id} onClick={() => void reorder(selected)}>
                                <RotateCcw className="h-4 w-4" />
                                {reorderingId === selected.id ? 'Adding…' : 'Order again'}
                            </Button>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

export function BookingList({ bookings, empty }: { bookings: UserBooking[]; empty: React.ReactNode }) {
    const [selected, setSelected] = useState<UserBooking | null>(null);

    if (bookings.length === 0) {
        return <div className="px-6 py-8">{empty}</div>;
    }

    return (
        <>
            <div className="divide-border divide-y">
                {bookings.map((booking) => (
                    <div key={booking.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="font-body text-sm font-medium">{booking.booking_number}</p>
                            <p className="font-body text-muted-foreground text-xs">
                                {formatDate(booking.date)} at {booking.time}
                                {partySize(booking) && ` · ${partySize(booking)}`}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className={`${badge} ${BOOKING_STATUS_STYLES[booking.status] ?? 'bg-muted text-muted-foreground'}`}>
                                {booking.status}
                            </span>
                            <Button variant="outline" size="sm" onClick={() => setSelected(booking)}>
                                <Eye className="h-4 w-4" />
                                View
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
                <DialogContent className="sm:max-w-md">
                    {selected && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="font-heading">{selected.booking_number}</DialogTitle>
                                <DialogDescription>{BOOKING_TYPES[selected.booking_type] ?? selected.booking_type} booking</DialogDescription>
                            </DialogHeader>

                            <span className={`${badge} ${BOOKING_STATUS_STYLES[selected.status] ?? 'bg-muted text-muted-foreground'} w-fit`}>
                                {selected.status}
                            </span>

                            <div className="divide-border border-border divide-y rounded-md border px-4">
                                <Row label="Date" value={formatDate(selected.date)} />
                                <Row label="Time" value={selected.time} />
                                <Row label={selected.booking_type === 'dine_in' ? 'Tables' : 'Guests'} value={partySize(selected)?.split(' ')[0]} />
                                <Row label="Occasion" value={selected.occasion} />
                            </div>

                            {selected.notes && <p className="font-body text-muted-foreground text-sm">Notes: {selected.notes}</p>}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
