import { Link, router } from '@inertiajs/react';
import { Eye, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatPrice } from '@/lib/price';
import {
    formatOrderStatus,
    orderStatusClass,
    summarizeProducts,
    type OrderStatusValue,
    type StatusOption,
} from '@/lib/order-status';

export type AdminOrderItem = {
    id: number;
    product_name: string;
    quantity: number;
    price: string;
};

export type AdminOrder = {
    id: number;
    order_number: string;
    customer_name: string;
    customer_email?: string;
    customer_phone?: string | null;
    subtotal?: string;
    tax?: string;
    total: string;
    status: string;
    collection_method?: string;
    pickup_time?: string | null;
    delivery_address?: string | null;
    delivery_time_preference?: string | null;
    delivery_fee?: string | number | null;
    delivery_zone?: string | null;
    payment_method?: string | null;
    notes?: string | null;
    created_at: string;
    items: AdminOrderItem[];
};

type OrdersPanelProps = {
    orders: AdminOrder[];
    statusOptions: StatusOption[];
    title?: string;
    showViewAll?: boolean;
    canDelete?: boolean;
};

function StatusBadge({ status }: { status: string }) {
    return (
        <span
            className={`inline-flex rounded-sm px-2 py-1 font-body text-xs font-medium uppercase tracking-wider ${orderStatusClass(status)}`}
        >
            {formatOrderStatus(status)}
        </span>
    );
}

export default function OrdersPanel({
    orders,
    statusOptions,
    title = 'Recent Orders',
    showViewAll = false,
    canDelete = false,
}: OrdersPanelProps) {
    const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
    const [deleteOrder, setDeleteOrder] = useState<AdminOrder | null>(null);
    const [status, setStatus] = useState<OrderStatusValue>('pending');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const openOrder = (order: AdminOrder) => {
        setSelectedOrder(order);
        setStatus(order.status as OrderStatusValue);
    };

    const closeModal = () => {
        setSelectedOrder(null);
        setSaving(false);
    };

    const saveStatus = () => {
        if (!selectedOrder) {
            return;
        }

        setSaving(true);
        router.patch(
            `/admin/orders/${selectedOrder.id}`,
            { status },
            {
                preserveScroll: true,
                onFinish: () => setSaving(false),
                onSuccess: closeModal,
            },
        );
    };

    const confirmDelete = () => {
        if (!deleteOrder) {
            return;
        }

        setDeleting(true);
        router.delete(`/admin/orders/${deleteOrder.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteOrder(null);
            },
        });
    };

    return (
        <>
            <section className="rounded-xl border border-border bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <h2 className="font-heading text-xl">{title}</h2>
                    {showViewAll && (
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/orders">View All</Link>
                        </Button>
                    )}
                </div>

                {orders.length === 0 ? (
                    <p className="px-6 py-8 font-body text-sm text-muted-foreground">No orders yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px]">
                            <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    <th className="px-6 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Order ID
                                    </th>
                                    <th className="px-6 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Buyer
                                    </th>
                                    <th className="px-6 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Product
                                    </th>
                                    <th className="px-6 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Price
                                    </th>
                                    <th className="px-6 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-muted/20">
                                        <td className="px-6 py-4 font-body text-sm font-medium">
                                            {order.order_number}
                                        </td>
                                        <td className="px-6 py-4 font-body text-sm text-foreground">
                                            {order.customer_name}
                                        </td>
                                        <td className="max-w-[200px] truncate px-6 py-4 font-body text-sm text-muted-foreground">
                                            {summarizeProducts(order.items)}
                                        </td>
                                        <td className="px-6 py-4 font-body text-sm font-semibold text-primary">
                                            ${formatPrice(order.total)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openOrder(order)}
                                                    aria-label={`View order ${order.order_number}`}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {canDelete && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeleteOrder(order)}
                                                        className="text-destructive hover:text-destructive"
                                                        aria-label={`Delete order ${order.order_number}`}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <Dialog open={selectedOrder !== null} onOpenChange={(open) => !open && closeModal()}>
                <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
                    {selectedOrder && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="font-heading">
                                    Order {selectedOrder.order_number}
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4 font-body text-sm">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                            Customer
                                        </p>
                                        <p className="font-medium">{selectedOrder.customer_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                            Placed
                                        </p>
                                        <p>{new Date(selectedOrder.created_at).toLocaleString()}</p>
                                    </div>
                                    {selectedOrder.customer_email && (
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                                Email
                                            </p>
                                            <p>{selectedOrder.customer_email}</p>
                                        </div>
                                    )}
                                    {selectedOrder.customer_phone && (
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                                Phone
                                            </p>
                                            <p>{selectedOrder.customer_phone}</p>
                                        </div>
                                    )}
                                    {selectedOrder.collection_method && (
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                                Collection
                                            </p>
                                            <p>
                                                {selectedOrder.collection_method === 'pickup'
                                                    ? 'Store Pickup'
                                                    : 'Delivery Request'}
                                            </p>
                                        </div>
                                    )}
                                    {selectedOrder.pickup_time && (
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                                Pickup
                                            </p>
                                            <p>{selectedOrder.pickup_time}</p>
                                        </div>
                                    )}
                                    {selectedOrder.delivery_address && (
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                                Delivery Address
                                            </p>
                                            <p>{selectedOrder.delivery_address}</p>
                                        </div>
                                    )}
                                    {selectedOrder.delivery_time_preference && (
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                                Preferred Delivery
                                            </p>
                                            <p>{selectedOrder.delivery_time_preference}</p>
                                        </div>
                                    )}
                                    {(Number(selectedOrder.delivery_fee) > 0 ||
                                        selectedOrder.delivery_zone) && (
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                                Delivery Fee
                                            </p>
                                            <p>
                                                $
                                                {formatPrice(
                                                    String(selectedOrder.delivery_fee ?? 0),
                                                )}
                                                {selectedOrder.delivery_zone
                                                    ? ` (${selectedOrder.delivery_zone})`
                                                    : ''}
                                            </p>
                                        </div>
                                    )}
                                    {selectedOrder.payment_method && (
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                                Payment
                                            </p>
                                            <p>
                                                {selectedOrder.payment_method === 'stripe'
                                                    ? 'Stripe / Online'
                                                    : 'Cash on Delivery'}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                                        Items
                                    </p>
                                    <ul className="divide-y divide-border rounded-md border border-border">
                                        {selectedOrder.items.map((item) => (
                                            <li
                                                key={item.id}
                                                className="flex items-center justify-between px-3 py-2"
                                            >
                                                <span>
                                                    {item.product_name}{' '}
                                                    <span className="text-muted-foreground">
                                                        ×{item.quantity}
                                                    </span>
                                                </span>
                                                <span className="font-medium">
                                                    ${formatPrice(String(Number(item.price) * item.quantity))}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="flex items-center justify-between border-t border-border pt-3">
                                    <span className="font-medium">Total</span>
                                    <span className="font-heading text-lg text-primary">
                                        ${formatPrice(selectedOrder.total)}
                                    </span>
                                </div>

                                {selectedOrder.notes && (
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                            Notes
                                        </p>
                                        <p className="mt-1 text-muted-foreground">{selectedOrder.notes}</p>
                                    </div>
                                )}

                                <div>
                                    <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                                        Update Status
                                    </p>
                                    <Select
                                        value={status}
                                        onValueChange={(value) => setStatus(value as OrderStatusValue)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statusOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={closeModal}>
                                    Cancel
                                </Button>
                                <Button onClick={saveStatus} disabled={saving}>
                                    {saving ? 'Saving…' : 'Save Status'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={deleteOrder !== null}
                onOpenChange={(open) => !open && !deleting && setDeleteOrder(null)}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-heading">Delete order?</DialogTitle>
                        <DialogDescription className="font-body">
                            {deleteOrder && (
                                <>
                                    You are about to permanently delete{' '}
                                    <span className="font-medium text-foreground">
                                        {deleteOrder.order_number}
                                    </span>
                                    . This action cannot be undone.
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteOrder(null)}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
                            {deleting ? 'Deleting…' : 'Delete Order'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
