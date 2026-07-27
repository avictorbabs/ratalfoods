import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    CreditCard,
    Store,
    Truck,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { useCart } from '@/lib/cart-store';
import { formatPrice } from '@/lib/price';
import type { OrderComplete, SharedData } from '@/types/ratalfoods';

type CollectionMethod = 'pickup' | 'delivery_request';

export default function Checkout() {
    const { items, subtotal, clearCart } = useCart();
    const { storeSettings, flash } = usePage<SharedData>().props;
    const taxRate = parseFloat(storeSettings.tax_rate) / 100;

    const [step, setStep] = useState(1);
    const [method, setMethod] = useState<CollectionMethod>('pickup');
    const [orderComplete, setOrderComplete] = useState<OrderComplete | null>(
        flash.orderComplete ?? null,
    );

    const [submitting, setSubmitting] = useState(false);

    const { data, setData, errors } = useForm({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        notes: '',
        delivery_address: '',
        delivery_time_preference: '',
        pickup_time: 'Ready in approximately 2 hours',
    });

    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    useEffect(() => {
        if (flash.orderComplete) {
            setOrderComplete(flash.orderComplete);
            clearCart();
        }
    }, [flash.orderComplete, clearCart]);

    useEffect(() => {
        if (items.length === 0 && !orderComplete) {
            router.visit('/menu');
        }
    }, [items.length, orderComplete]);

    const placeOrder = (event: FormEvent) => {
        event.preventDefault();

        router.post(
            '/orders',
            {
                customer_name: data.customer_name,
                customer_email: data.customer_email,
                customer_phone: data.customer_phone,
                notes: data.notes,
                collection_method: method,
                pickup_time: method === 'pickup' ? data.pickup_time : null,
                delivery_address: method === 'delivery_request' ? data.delivery_address : null,
                delivery_time_preference:
                    method === 'delivery_request' ? data.delivery_time_preference : null,
                items: items.map((item) => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                })),
            },
            {
                preserveScroll: true,
                onStart: () => setSubmitting(true),
                onFinish: () => setSubmitting(false),
            },
        );
    };

    if (orderComplete) {
        return (
            <AppLayout>
                <Head title="Order Confirmed" />
                <div className="pt-20 pb-20 sm:pt-24">
                    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', damping: 15 }}
                        >
                            <CheckCircle2 className="mx-auto mb-6 h-16 w-16 text-accent" />
                        </motion.div>
                        <h1 className="mb-3 font-heading text-3xl tracking-tight sm:text-4xl">
                            Order Confirmed
                        </h1>
                        <p className="mb-2 font-body text-muted-foreground">
                            Thank you, {orderComplete.customer_name}!
                        </p>
                        <div className="mt-8 rounded-md border border-border bg-card p-6 text-left">
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">
                                        Order Number
                                    </p>
                                    <p className="mt-1 font-heading text-xl">
                                        {orderComplete.order_number}
                                    </p>
                                </div>
                                <div className="rounded-sm bg-accent/10 px-3 py-1">
                                    <span className="font-body text-xs font-medium text-accent uppercase">
                                        {orderComplete.collection_method === 'pickup'
                                            ? 'Pickup'
                                            : 'Delivery Request'}
                                    </span>
                                </div>
                            </div>

                            {orderComplete.collection_method === 'pickup' && (
                                <div className="mb-4 flex items-center gap-2 rounded-md bg-accent/5 p-3">
                                    <Store className="h-4 w-4 text-accent" />
                                    <span className="font-body text-sm text-accent">
                                        Ready for pickup in approximately 2 hours
                                    </span>
                                </div>
                            )}

                            {orderComplete.collection_method === 'delivery_request' && (
                                <div className="mb-4 flex items-center gap-2 rounded-md bg-primary/5 p-3">
                                    <Truck className="h-4 w-4 text-primary" />
                                    <span className="font-body text-sm text-primary">
                                        We&apos;ll contact you to confirm delivery details
                                    </span>
                                </div>
                            )}

                            <div className="space-y-2 border-t border-border pt-4">
                                <div className="flex justify-between font-body text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>${formatPrice(orderComplete.subtotal)}</span>
                                </div>
                                <div className="flex justify-between font-body text-sm">
                                    <span className="text-muted-foreground">
                                        Tax ({storeSettings.tax_rate}%)
                                    </span>
                                    <span>${formatPrice(orderComplete.tax)}</span>
                                </div>
                                <div className="flex justify-between border-t border-border pt-2 font-body text-base font-semibold">
                                    <span>Total</span>
                                    <span>${formatPrice(orderComplete.total)}</span>
                                </div>
                            </div>
                        </div>

                        <p className="mt-6 font-body text-xs text-muted-foreground">
                            A confirmation has been sent to {orderComplete.customer_email}
                        </p>

                        <Button className="mt-8 font-body text-sm tracking-wide uppercase" asChild>
                            <Link href="/menu">Continue Shopping</Link>
                        </Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (items.length === 0) {
        return null;
    }

    return (
        <AppLayout>
            <Head title="Checkout" />

            <div className="pt-20 pb-20 sm:pt-24">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <Link
                        href="/menu"
                        className="mb-8 inline-flex items-center gap-1.5 font-body text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Menu
                    </Link>

                    <h1 className="mb-10 font-heading text-3xl tracking-tight sm:text-4xl">
                        Checkout
                    </h1>

                    <form onSubmit={placeOrder}>
                        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5 lg:gap-16">
                            <div className="space-y-8 lg:col-span-3">
                                <div className="space-y-4">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="flex w-full items-center gap-3 text-left"
                                    >
                                        <span
                                            className={`flex h-7 w-7 items-center justify-center rounded-full font-body text-xs ${
                                                step >= 1
                                                    ? 'bg-foreground text-background'
                                                    : 'bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            1
                                        </span>
                                        <span className="font-body text-sm font-medium uppercase tracking-wider">
                                            Collection Method
                                        </span>
                                    </button>

                                    <AnimatePresence>
                                        {step >= 1 && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="ml-10 overflow-hidden"
                                            >
                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setMethod('pickup')}
                                                        className={`rounded-md border-2 p-5 text-left transition-all ${
                                                            method === 'pickup'
                                                                ? 'border-primary bg-primary/5'
                                                                : 'border-border hover:border-foreground/20'
                                                        }`}
                                                    >
                                                        <Store
                                                            className={`mb-2 h-5 w-5 ${
                                                                method === 'pickup'
                                                                    ? 'text-primary'
                                                                    : 'text-muted-foreground'
                                                            }`}
                                                        />
                                                        <h4 className="font-body text-sm font-medium">
                                                            Store Pickup
                                                        </h4>
                                                        <p className="mt-1 font-body text-xs text-muted-foreground">
                                                            Pick up from our Windsor location
                                                        </p>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setMethod('delivery_request')
                                                        }
                                                        className={`rounded-md border-2 p-5 text-left transition-all ${
                                                            method === 'delivery_request'
                                                                ? 'border-primary bg-primary/5'
                                                                : 'border-border hover:border-foreground/20'
                                                        }`}
                                                    >
                                                        <Truck
                                                            className={`mb-2 h-5 w-5 ${
                                                                method === 'delivery_request'
                                                                    ? 'text-primary'
                                                                    : 'text-muted-foreground'
                                                            }`}
                                                        />
                                                        <h4 className="font-body text-sm font-medium">
                                                            Delivery Request
                                                        </h4>
                                                        <p className="mt-1 font-body text-xs text-muted-foreground">
                                                            We&apos;ll contact you with delivery
                                                            details
                                                        </p>
                                                    </button>
                                                </div>

                                                {step === 1 && (
                                                    <Button
                                                        type="button"
                                                        className="mt-4 font-body text-sm tracking-wide uppercase"
                                                        onClick={() => setStep(2)}
                                                    >
                                                        Continue
                                                    </Button>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="space-y-4">
                                    <button
                                        type="button"
                                        onClick={() => step > 1 && setStep(2)}
                                        className="flex w-full items-center gap-3 text-left"
                                    >
                                        <span
                                            className={`flex h-7 w-7 items-center justify-center rounded-full font-body text-xs ${
                                                step >= 2
                                                    ? 'bg-foreground text-background'
                                                    : 'bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            2
                                        </span>
                                        <span className="font-body text-sm font-medium uppercase tracking-wider">
                                            Your Details
                                        </span>
                                    </button>

                                    <AnimatePresence>
                                        {step >= 2 && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="ml-10 space-y-4 overflow-hidden"
                                            >
                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                    <div>
                                                        <label className="mb-1.5 block font-body text-xs uppercase tracking-wider text-muted-foreground">
                                                            Full Name *
                                                        </label>
                                                        <Input
                                                            required
                                                            value={data.customer_name}
                                                            onChange={(event) =>
                                                                setData(
                                                                    'customer_name',
                                                                    event.target.value,
                                                                )
                                                            }
                                                            className="h-10 font-body text-sm"
                                                        />
                                                        {errors.customer_name && (
                                                            <p className="mt-1 text-sm text-destructive">
                                                                {errors.customer_name}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="mb-1.5 block font-body text-xs uppercase tracking-wider text-muted-foreground">
                                                            Email *
                                                        </label>
                                                        <Input
                                                            required
                                                            type="email"
                                                            value={data.customer_email}
                                                            onChange={(event) =>
                                                                setData(
                                                                    'customer_email',
                                                                    event.target.value,
                                                                )
                                                            }
                                                            className="h-10 font-body text-sm"
                                                        />
                                                        {errors.customer_email && (
                                                            <p className="mt-1 text-sm text-destructive">
                                                                {errors.customer_email}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="mb-1.5 block font-body text-xs uppercase tracking-wider text-muted-foreground">
                                                        Phone
                                                    </label>
                                                    <Input
                                                        value={data.customer_phone}
                                                        onChange={(event) =>
                                                            setData(
                                                                'customer_phone',
                                                                event.target.value,
                                                            )
                                                        }
                                                        className="h-10 font-body text-sm"
                                                    />
                                                </div>

                                                {method === 'delivery_request' && (
                                                    <>
                                                        <div>
                                                            <label className="mb-1.5 block font-body text-xs uppercase tracking-wider text-muted-foreground">
                                                                Delivery Address *
                                                            </label>
                                                            <Input
                                                                required
                                                                value={data.delivery_address}
                                                                onChange={(event) =>
                                                                    setData(
                                                                        'delivery_address',
                                                                        event.target.value,
                                                                    )
                                                                }
                                                                placeholder="Full address"
                                                                className="h-10 font-body text-sm"
                                                            />
                                                            {errors.delivery_address && (
                                                                <p className="mt-1 text-sm text-destructive">
                                                                    {errors.delivery_address}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="mb-1.5 block font-body text-xs uppercase tracking-wider text-muted-foreground">
                                                                Preferred Time
                                                            </label>
                                                            <Input
                                                                value={
                                                                    data.delivery_time_preference
                                                                }
                                                                onChange={(event) =>
                                                                    setData(
                                                                        'delivery_time_preference',
                                                                        event.target.value,
                                                                    )
                                                                }
                                                                placeholder="e.g. Saturday 2pm"
                                                                className="h-10 font-body text-sm"
                                                            />
                                                        </div>
                                                    </>
                                                )}

                                                <div>
                                                    <label className="mb-1.5 block font-body text-xs uppercase tracking-wider text-muted-foreground">
                                                        Order Notes
                                                    </label>
                                                    <Textarea
                                                        value={data.notes}
                                                        onChange={(event) =>
                                                            setData('notes', event.target.value)
                                                        }
                                                        rows={2}
                                                        placeholder="Any special requests..."
                                                        className="font-body text-sm"
                                                    />
                                                </div>

                                                {step === 2 && (
                                                    <Button
                                                        type="button"
                                                        className="font-body text-sm tracking-wide uppercase"
                                                        onClick={() => setStep(3)}
                                                        disabled={
                                                            !data.customer_name ||
                                                            !data.customer_email ||
                                                            (method === 'delivery_request' &&
                                                                !data.delivery_address)
                                                        }
                                                    >
                                                        Continue to Payment
                                                    </Button>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="space-y-4">
                                    <button
                                        type="button"
                                        onClick={() => step > 2 && setStep(3)}
                                        className="flex w-full items-center gap-3 text-left"
                                    >
                                        <span
                                            className={`flex h-7 w-7 items-center justify-center rounded-full font-body text-xs ${
                                                step >= 3
                                                    ? 'bg-foreground text-background'
                                                    : 'bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            3
                                        </span>
                                        <span className="font-body text-sm font-medium uppercase tracking-wider">
                                            {method === 'pickup' ? 'Payment' : 'Confirm Order'}
                                        </span>
                                    </button>

                                    <AnimatePresence>
                                        {step >= 3 && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="ml-10 space-y-4 overflow-hidden"
                                            >
                                                {method === 'pickup' ? (
                                                    <div className="rounded-md border border-border bg-card p-5">
                                                        <div className="mb-4 flex items-center gap-2">
                                                            <CreditCard className="h-5 w-5 text-primary" />
                                                            <span className="font-body text-sm font-medium">
                                                                Pay on Pickup
                                                            </span>
                                                        </div>
                                                        <p className="mb-4 font-body text-xs text-muted-foreground">
                                                            Your order will be confirmed
                                                            immediately. Pay at our Windsor location
                                                            when you pick up your order.
                                                        </p>
                                                        <Button
                                                            type="submit"
                                                            className="h-12 w-full font-body text-sm tracking-wide uppercase"
                                                            disabled={submitting}
                                                        >
                                                            {submitting
                                                                ? 'Processing...'
                                                                : `Place Order — $${formatPrice(total)}`}
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="rounded-md border border-border bg-card p-5">
                                                        <div className="mb-4 flex items-center gap-2">
                                                            <Truck className="h-5 w-5 text-primary" />
                                                            <span className="font-body text-sm font-medium">
                                                                Delivery Quote Request
                                                            </span>
                                                        </div>
                                                        <p className="mb-4 font-body text-xs text-muted-foreground">
                                                            We&apos;ll contact you with delivery
                                                            pricing and arrange a convenient time.
                                                        </p>
                                                        <Button
                                                            type="submit"
                                                            className="h-12 w-full font-body text-sm tracking-wide uppercase"
                                                            disabled={submitting}
                                                        >
                                                            {submitting
                                                                ? 'Submitting...'
                                                                : 'Submit Delivery Request'}
                                                        </Button>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="lg:col-span-2">
                                <div className="rounded-md border border-border bg-card p-6 lg:sticky lg:top-24">
                                    <h3 className="mb-6 font-heading text-lg">Order Summary</h3>
                                    <div className="mb-6 space-y-4">
                                        {items.map((item) => (
                                            <div key={item.line_id} className="flex gap-3">
                                                {item.image_url && (
                                                    <img
                                                        src={item.image_url}
                                                        alt={item.product_name}
                                                        className="h-12 w-12 flex-shrink-0 rounded-sm object-cover"
                                                    />
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-body text-sm">
                                                        {item.product_name}
                                                    </p>
                                                    <p className="font-body text-xs text-muted-foreground">
                                                        Qty: {item.quantity}
                                                    </p>
                                                </div>
                                                <p className="font-body text-sm font-medium">
                                                    ${formatPrice(item.price * item.quantity)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-2 border-t border-border pt-4">
                                        <div className="flex justify-between font-body text-sm">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span>${formatPrice(subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between font-body text-sm">
                                            <span className="text-muted-foreground">
                                                Tax ({storeSettings.tax_rate}%)
                                            </span>
                                            <span>${formatPrice(tax)}</span>
                                        </div>
                                        <div className="flex justify-between border-t border-border pt-2 font-body text-base font-semibold">
                                            <span>Total</span>
                                            <span>${formatPrice(total)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
