import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatOrderStatus, orderStatusClass, summarizeProducts, type OrderStatusValue, type StatusOption } from '@/lib/order-status';
import { formatPrice } from '@/lib/price';
import { Link, router } from '@inertiajs/react';
import { Eye, Trash2 } from 'lucide-react';
import { useState } from 'react';

export type AdminOrderItem = {
    id: number;
    product_name: string;
    quantity: number;
    price: string;
};

export type AdminOrder = {
    id: number;
    order_number: string;
    recurring_order_id?: number | null;
    customer_name: string;
    customer_email?: string;
    customer_phone?: string | null;
    subtotal?: string;
    tax?: string;
    discount?: string | number | null;
    coupon_code?: string | null;
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
        <span className={`font-body inline-flex rounded-sm px-2 py-1 text-xs font-medium tracking-wider uppercase ${orderStatusClass(status)}`}>
            {formatOrderStatus(status)}
        </span>
    );
}

export default function OrdersPanel({ orders, statusOptions, title = 'Recent Orders', showViewAll = false, canDelete = false }: OrdersPanelProps) {
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
            <section className="border-border rounded-xl border bg-white shadow-sm">
                <div className="border-border flex items-center justify-between border-b px-6 py-4">
                    <h2 className="font-heading text-xl">{title}</h2>
                    {showViewAll && (
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/orders">View All</Link>
                        </Button>
                    )}
                </div>

                {orders.length === 0 ? (
                    <p className="font-body text-muted-foreground px-6 py-8 text-sm">No orders yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px]">
                            <thead>
                                <tr className="border-border bg-muted/30 border-b">
                                    <th className="font-body text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                                        Order ID
                                    </th>
                                    <th className="font-body text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                                        Buyer
                                    </th>
                                    <th className="font-body text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                                        Product
                                    </th>
                                    <th className="font-body text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                                        Price
                                    </th>
                                    <th className="font-body text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                                        Status
                                    </th>
                                    <th className="font-body text-muted-foreground px-6 py-3 text-right text-xs font-medium tracking-wider uppercase">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-border divide-y">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-muted/20">
                                        <td className="font-body px-6 py-4 text-sm font-medium">
                                            {order.order_number}
                                            {order.recurring_order_id ? (
                                                <span className="bg-primary/15 text-primary ml-2 rounded-sm px-1.5 py-0.5 text-[10px] font-medium tracking-wider uppercase">
                                                    Repeat
                                                </span>
                                            ) : null}
                                        </td>
                                        <td className="font-body text-foreground px-6 py-4 text-sm">{order.customer_name}</td>
                                        <td className="font-body text-muted-foreground max-w-[200px] truncate px-6 py-4 text-sm">
                                            {summarizeProducts(order.items)}
                                        </td>
                                        <td className="font-body text-primary px-6 py-4 text-sm font-semibold">${formatPrice(order.total)}</td>
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
                                    {selectedOrder.recurring_order_id ? (
                                        <span className="bg-primary/15 text-primary ml-2 rounded-sm px-1.5 py-0.5 align-middle text-[10px] font-medium tracking-wider uppercase">
                                            Repeat
                                        </span>
                                    ) : null}
                                </DialogTitle>
                            </DialogHeader>

                            <div className="font-body space-y-4 text-sm">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <p className="text-muted-foreground text-xs tracking-wider uppercase">Customer</p>
                                        <p className="font-medium">{selectedOrder.customer_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs tracking-wider uppercase">Placed</p>
                                        <p>{new Date(selectedOrder.created_at).toLocaleString()}</p>
                                    </div>
                                    {selectedOrder.customer_email && (
                                        <div>
                                            <p className="text-muted-foreground text-xs tracking-wider uppercase">Email</p>
                                            <p>{selectedOrder.customer_email}</p>
                                        </div>
                                    )}
                                    {selectedOrder.customer_phone && (
                                        <div>
                                            <p className="text-muted-foreground text-xs tracking-wider uppercase">Phone</p>
                                            <p>{selectedOrder.customer_phone}</p>
                                        </div>
                                    )}
                                    {selectedOrder.collection_method && (
                                        <div>
                                            <p className="text-muted-foreground text-xs tracking-wider uppercase">Collection</p>
                                            <p>{selectedOrder.collection_method === 'pickup' ? 'Store Pickup' : 'Delivery Request'}</p>
                                        </div>
                                    )}
                                    {selectedOrder.pickup_time && (
                                        <div>
                                            <p className="text-muted-foreground text-xs tracking-wider uppercase">Pickup</p>
                                            <p>{selectedOrder.pickup_time}</p>
                                        </div>
                                    )}
                                    {selectedOrder.delivery_address && (
                                        <div>
                                            <p className="text-muted-foreground text-xs tracking-wider uppercase">Delivery Address</p>
                                            <p>{selectedOrder.delivery_address}</p>
                                        </div>
                                    )}
                                    {selectedOrder.delivery_time_preference && (
                                        <div>
                                            <p className="text-muted-foreground text-xs tracking-wider uppercase">Preferred Delivery</p>
                                            <p>{selectedOrder.delivery_time_preference}</p>
                                        </div>
                                    )}
                                    {(Number(selectedOrder.delivery_fee) > 0 || selectedOrder.delivery_zone) && (
                                        <div>
                                            <p className="text-muted-foreground text-xs tracking-wider uppercase">Delivery Fee</p>
                                            <p>
                                                ${formatPrice(String(selectedOrder.delivery_fee ?? 0))}
                                                {selectedOrder.delivery_zone ? ` (${selectedOrder.delivery_zone})` : ''}
                                            </p>
                                        </div>
                                    )}
                                    {Number(selectedOrder.discount) > 0 && (
                                        <div>
                                            <p className="text-muted-foreground text-xs tracking-wider uppercase">Coupon</p>
                                            <p>
                                                {selectedOrder.coupon_code ?? 'Discount'} (-${formatPrice(String(selectedOrder.discount))})
                                            </p>
                                        </div>
                                    )}
                                    {selectedOrder.payment_method && (
                                        <div>
                                            <p className="text-muted-foreground text-xs tracking-wider uppercase">Payment</p>
                                            <p>{selectedOrder.payment_method === 'stripe' ? 'Stripe / Online' : 'Cash on Delivery'}</p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <p className="text-muted-foreground mb-2 text-xs tracking-wider uppercase">Items</p>
                                    <ul className="divide-border border-border divide-y rounded-md border">
                                        {selectedOrder.items.map((item) => (
                                            <li key={item.id} className="flex items-center justify-between px-3 py-2">
                                                <span>
                                                    {item.product_name} <span className="text-muted-foreground">×{item.quantity}</span>
                                                </span>
                                                <span className="font-medium">${formatPrice(String(Number(item.price) * item.quantity))}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="border-border flex items-center justify-between border-t pt-3">
                                    <span className="font-medium">Total</span>
                                    <span className="font-heading text-primary text-lg">${formatPrice(selectedOrder.total)}</span>
                                </div>

                                {selectedOrder.notes && (
                                    <div>
                                        <p className="text-muted-foreground text-xs tracking-wider uppercase">Notes</p>
                                        <p className="text-muted-foreground mt-1">{selectedOrder.notes}</p>
                                    </div>
                                )}

                                <div>
                                    <p className="text-muted-foreground mb-2 text-xs tracking-wider uppercase">Update Status</p>
                                    <Select value={status} onValueChange={(value) => setStatus(value as OrderStatusValue)}>
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

            <Dialog open={deleteOrder !== null} onOpenChange={(open) => !open && !deleting && setDeleteOrder(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-heading">Delete order?</DialogTitle>
                        <DialogDescription className="font-body">
                            {deleteOrder && (
                                <>
                                    You are about to permanently delete{' '}
                                    <span className="text-foreground font-medium">{deleteOrder.order_number}</span>. This action cannot be undone.
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteOrder(null)} disabled={deleting}>
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
