import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import AppLayout from '@/layouts/app-layout';
import { formatOrderStatus, orderStatusClass } from '@/lib/order-status';
import { formatPrice } from '@/lib/price';
import { Head, router } from '@inertiajs/react';
import { AlertTriangle, Check, CircleDot, Info, MapPin } from 'lucide-react';
import { useEffect } from 'react';

type TimelineStep = {
    key: string;
    label: string;
    description: string;
    state: 'done' | 'current' | 'upcoming';
    reached_at: string | null;
};

type TrackedOrder = {
    order_number: string;
    status: string;
    status_label: string;
    customer_name: string;
    collection_method: 'pickup' | 'delivery_request';
    collection_label: string;
    delivery_address: string | null;
    pickup_address: string | null;
    placed_at: string;
    subtotal: number;
    discount: number;
    loyalty_discount: number;
    tax: number;
    delivery_fee: number;
    total: number;
    items: { name: string; quantity: number; price: number }[];
};

type Timeline = {
    steps: TimelineStep[];
    notice: { tone: 'neutral' | 'warning'; title: string; message: string } | null;
    is_finished: boolean;
};

const REFRESH_MS = 20_000;

function formatTime(value: string | null): string | null {
    if (!value) {
        return null;
    }

    return new Date(value).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function OrderTracking({ order, timeline }: { order: TrackedOrder; timeline: Timeline }) {
    // Keep the page live while the order is still moving.
    useEffect(() => {
        if (timeline.is_finished) {
            return;
        }

        const timer = window.setInterval(() => {
            if (document.visibilityState === 'visible') {
                router.reload({ only: ['order', 'timeline'] });
            }
        }, REFRESH_MS);

        return () => window.clearInterval(timer);
    }, [timeline.is_finished]);

    return (
        <AppLayout>
            <Head title={`Track order ${order.order_number}`} />

            <section className="bg-background px-4 pt-28 pb-16 sm:pt-32">
                <div className="mx-auto max-w-2xl">
                    <PageBreadcrumb items={[{ title: 'Home', href: '/' }, { title: 'Track order' }]} />

                    <div className="border-border mt-4 rounded-xl border bg-white p-6 shadow-sm sm:p-8">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="font-body text-muted-foreground text-xs tracking-[0.2em] uppercase">Order</p>
                                <h1 className="font-heading text-2xl tracking-tight">{order.order_number}</h1>
                                <p className="font-body text-muted-foreground mt-1 text-sm">
                                    Hi {order.customer_name.split(' ')[0]}, here is where your order is.
                                </p>
                            </div>
                            <span
                                className={`font-body inline-flex rounded-sm px-2 py-1 text-xs font-medium tracking-wider uppercase ${orderStatusClass(order.status)}`}
                            >
                                {formatOrderStatus(order.status)}
                            </span>
                        </div>

                        {timeline.notice ? (
                            <div
                                className={`font-body mt-6 flex gap-3 rounded-lg p-4 text-sm ${
                                    timeline.notice.tone === 'warning' ? 'bg-orange-50 text-orange-900' : 'bg-muted text-foreground'
                                }`}
                            >
                                {timeline.notice.tone === 'warning' ? (
                                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                                ) : (
                                    <Info className="mt-0.5 h-5 w-5 shrink-0" />
                                )}
                                <div>
                                    <p className="font-semibold">{timeline.notice.title}</p>
                                    <p className="mt-1">{timeline.notice.message}</p>
                                </div>
                            </div>
                        ) : (
                            <ol className="mt-8 space-y-0">
                                {timeline.steps.map((step, index) => {
                                    const last = index === timeline.steps.length - 1;
                                    const reached = formatTime(step.reached_at);

                                    return (
                                        <li key={step.key} className="relative flex gap-4 pb-8 last:pb-0">
                                            {!last && (
                                                <span
                                                    className={`absolute top-8 left-4 -ml-px h-[calc(100%-2rem)] w-0.5 ${
                                                        step.state === 'done' ? 'bg-primary' : 'bg-border'
                                                    }`}
                                                    aria-hidden="true"
                                                />
                                            )}
                                            <span
                                                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                                                    step.state === 'done'
                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                        : step.state === 'current'
                                                          ? 'border-primary text-primary bg-white'
                                                          : 'border-border bg-white text-transparent'
                                                }`}
                                            >
                                                {step.state === 'done' ? <Check className="h-4 w-4" /> : <CircleDot className="h-4 w-4" />}
                                            </span>
                                            <div className="pt-0.5">
                                                <p
                                                    className={`font-body text-sm font-semibold ${
                                                        step.state === 'upcoming' ? 'text-muted-foreground' : 'text-foreground'
                                                    }`}
                                                >
                                                    {step.label}
                                                    {step.state === 'current' && (
                                                        <span className="bg-primary/15 text-primary ml-2 rounded-sm px-1.5 py-0.5 text-[10px] font-medium tracking-wider uppercase">
                                                            Now
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="font-body text-muted-foreground text-sm">{step.description}</p>
                                                {reached && <p className="font-body text-muted-foreground mt-0.5 text-xs">{reached}</p>}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        )}

                        <div className="border-border mt-8 space-y-2 border-t pt-6">
                            <p className="font-body text-sm">{order.collection_label}</p>
                            {(order.pickup_address || order.delivery_address) && (
                                <p className="font-body text-muted-foreground flex items-start gap-2 text-sm">
                                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                                    {order.pickup_address ?? order.delivery_address}
                                </p>
                            )}
                        </div>

                        <div className="border-border mt-6 border-t pt-6">
                            <p className="font-body text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">Your items</p>
                            <div className="divide-border divide-y">
                                {order.items.map((item, index) => (
                                    <div key={index} className="font-body flex justify-between gap-4 py-2 text-sm">
                                        <span>
                                            {item.name} <span className="text-muted-foreground">×{item.quantity}</span>
                                        </span>
                                        <span>${formatPrice(item.price * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="font-body mt-3 space-y-1 text-sm">
                                {order.discount > 0 && (
                                    <div className="flex justify-between text-emerald-700">
                                        <span>Discount</span>
                                        <span>-${formatPrice(order.discount)}</span>
                                    </div>
                                )}
                                {order.loyalty_discount > 0 && (
                                    <div className="flex justify-between text-emerald-700">
                                        <span>Loyalty points</span>
                                        <span>-${formatPrice(order.loyalty_discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tax</span>
                                    <span>${formatPrice(order.tax)}</span>
                                </div>
                                {order.delivery_fee > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Delivery</span>
                                        <span>${formatPrice(order.delivery_fee)}</span>
                                    </div>
                                )}
                                <div className="border-border flex justify-between border-t pt-2 text-base font-semibold">
                                    <span>Total</span>
                                    <span>${formatPrice(order.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </AppLayout>
    );
}
