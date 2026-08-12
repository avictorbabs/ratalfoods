import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    ChevronDown,
    Clock,
    CreditCard,
    House,
    Store,
    Truck,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { useCart } from '@/lib/cart-store';
import { formatPrice } from '@/lib/price';
import type { DeliveryFeeZone, OrderComplete, SharedData } from '@/types/ratalfoods';

type CollectionMethod = 'pickup' | 'delivery_request';

const PICKUP_TIMES = [
    '11:00 AM',
    '12:00 PM',
    '1:00 PM',
    '2:00 PM',
    '3:00 PM',
    '4:00 PM',
    '5:00 PM',
    '6:00 PM',
    '7:00 PM',
    '8:00 PM',
];

function todayDateInput(): string {
    return new Date().toLocaleDateString('en-CA');
}

function parseMatchTerms(matchTerms: string): string[] {
    return matchTerms
        .split(/[,;\n]+/)
        .map((term) => term.trim())
        .filter(Boolean);
}

function matchDeliveryFee(
    address: string,
    zones: DeliveryFeeZone[],
): { name: string; fee: number } | null {
    const normalizedAddress = address.trim().toLowerCase();

    if (!normalizedAddress) {
        return null;
    }

    let best: { name: string; fee: number; termLength: number } | null = null;

    for (const zone of zones) {
        for (const term of parseMatchTerms(zone.match_terms)) {
            const normalizedTerm = term.toLowerCase();

            if (!normalizedTerm || !normalizedAddress.includes(normalizedTerm)) {
                continue;
            }

            const termLength = normalizedTerm.length;
            const fee = Number(zone.fee);

            if (!best || termLength > best.termLength) {
                best = {
                    name: zone.name,
                    fee,
                    termLength,
                };
            }
        }
    }

    return best ? { name: best.name, fee: best.fee } : null;
}

export default function Checkout({
    deliveryFees = [],
}: {
    deliveryFees?: DeliveryFeeZone[];
}) {
    const { items, subtotal, clearCart } = useCart();
    const { storeSettings, flash, errors: pageErrors } = usePage<SharedData & { errors: Record<string, string> }>().props;
    const taxRate = parseFloat(storeSettings.tax_rate) / 100;

    const [step, setStep] = useState(1);
    const [method, setMethod] = useState<CollectionMethod>('pickup');
    const [hoursOpen, setHoursOpen] = useState(false);
    const [cashOnDelivery, setCashOnDelivery] = useState(true);
    const [orderComplete, setOrderComplete] = useState<OrderComplete | null>(
        flash.orderComplete ?? null,
    );

    const [submitting, setSubmitting] = useState(false);
    const pickupLocation =
        storeSettings.address && storeSettings.address.length > 15
            ? storeSettings.address
            : '499 University Ave W, Windsor, ON N9A 5P8';

    const { data, setData, errors } = useForm({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        notes: '',
        delivery_address: '',
        delivery_date: '',
        delivery_time: '',
        pickup_date: '',
        pickup_time: '',
    });

    const tax = subtotal * taxRate;
    const matchedDelivery =
        method === 'delivery_request'
            ? matchDeliveryFee(data.delivery_address, deliveryFees)
            : null;
    const deliveryFee = matchedDelivery?.fee ?? 0;
    const total = subtotal + tax + deliveryFee;

    useEffect(() => {
        if (flash.orderComplete) {
            setOrderComplete(flash.orderComplete);
            clearCart();
        }
    }, [flash.orderComplete, clearCart]);

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
                pickup_date: method === 'pickup' ? data.pickup_date : null,
                pickup_time: method === 'pickup' ? data.pickup_time : null,
                delivery_address: method === 'delivery_request' ? data.delivery_address : null,
                delivery_date: method === 'delivery_request' ? data.delivery_date : null,
                delivery_time: method === 'delivery_request' ? data.delivery_time : null,
                payment_method: cashOnDelivery ? 'cash_on_delivery' : 'stripe',
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
                                <div className="mb-4 space-y-2 rounded-md bg-accent/5 p-3">
                                    <div className="flex items-center gap-2">
                                        <Store className="h-4 w-4 shrink-0 text-accent" />
                                        <span className="font-body text-sm text-accent">
                                            {orderComplete.pickup_time
                                                ? `Pickup ${orderComplete.pickup_time}`
                                                : 'Store pickup'}
                                        </span>
                                    </div>
                                    <p className="pl-6 font-body text-xs text-muted-foreground">
                                        {pickupLocation}
                                    </p>
                                </div>
                            )}

                            {orderComplete.collection_method === 'delivery_request' && (
                                <div className="mb-4 flex items-center gap-2 rounded-md bg-primary/5 p-3">
                                    <Truck className="h-4 w-4 text-primary" />
                                    <span className="font-body text-sm text-primary">
                                        Please check your email for your order details. Also we may
                                        call you if further clarification is needed.
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
                                {(orderComplete.delivery_fee ?? 0) > 0 && (
                                    <div className="flex justify-between font-body text-sm">
                                        <span className="text-muted-foreground">
                                            Delivery
                                            {orderComplete.delivery_zone
                                                ? ` (${orderComplete.delivery_zone})`
                                                : ''}
                                        </span>
                                        <span>${formatPrice(orderComplete.delivery_fee ?? 0)}</span>
                                    </div>
                                )}
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
        return (
            <AppLayout>
                <Head title="Checkout" />
                <div className="pt-20 pb-20 sm:pt-24">
                    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
                        <h1 className="mb-3 font-heading text-3xl tracking-tight sm:text-4xl">
                            Your cart is empty
                        </h1>
                        <p className="mb-8 font-body text-muted-foreground">
                            Add items from the menu before checking out.
                        </p>
                        <Button className="font-body text-sm tracking-wide uppercase" asChild>
                            <Link href="/menu">Browse Menu</Link>
                        </Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Checkout" />

            <div className="pt-20 pb-20 sm:pt-24">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="mb-10 flex items-center justify-between gap-4">
                        <h1 className="font-heading text-3xl tracking-tight sm:text-4xl">
                            Checkout
                        </h1>
                        <Link
                            href="/menu"
                            className="inline-flex shrink-0 items-center gap-1.5 font-body text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Menu
                        </Link>
                    </div>

                    <form onSubmit={placeOrder}>
                        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5 lg:gap-16">
                            <div className="space-y-8 rounded-md border border-border bg-card p-6 sm:p-8 lg:col-span-3">
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

                                                {method === 'pickup' && (
                                                    <>
                                                        <div>
                                                            <label className="mb-1.5 block font-body text-xs uppercase tracking-wider text-muted-foreground">
                                                                Pickup Location
                                                            </label>
                                                            <div className="relative">
                                                                <House className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                                <Input
                                                                    readOnly
                                                                    value={pickupLocation}
                                                                    className="h-10 bg-muted/40 pr-3 pl-9 font-body text-sm"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                            <div>
                                                                <label className="mb-1.5 block font-body text-xs uppercase tracking-wider text-muted-foreground">
                                                                    Pickup Date *
                                                                </label>
                                                                <div className="relative">
                                                                    <Calendar className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                                    <Input
                                                                        required
                                                                        type="date"
                                                                        min={todayDateInput()}
                                                                        value={data.pickup_date}
                                                                        onChange={(event) =>
                                                                            setData(
                                                                                'pickup_date',
                                                                                event.target.value,
                                                                            )
                                                                        }
                                                                        className="h-10 pl-9 font-body text-sm"
                                                                    />
                                                                </div>
                                                                {errors.pickup_date && (
                                                                    <p className="mt-1 text-sm text-destructive">
                                                                        {errors.pickup_date}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <label className="mb-1.5 block font-body text-xs uppercase tracking-wider text-muted-foreground">
                                                                    Preferred Pickup Time *
                                                                </label>
                                                                <div className="relative">
                                                                    <Clock className="pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                                    <select
                                                                        required
                                                                        value={data.pickup_time}
                                                                        onChange={(event) =>
                                                                            setData(
                                                                                'pickup_time',
                                                                                event.target.value,
                                                                            )
                                                                        }
                                                                        className="h-10 w-full appearance-none rounded-md border border-input bg-background py-2 pr-8 pl-9 font-body text-sm"
                                                                    >
                                                                        <option value="">
                                                                            Select time
                                                                        </option>
                                                                        {PICKUP_TIMES.map((time) => (
                                                                            <option
                                                                                key={time}
                                                                                value={time}
                                                                            >
                                                                                {time}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                                </div>
                                                                {errors.pickup_time && (
                                                                    <p className="mt-1 text-sm text-destructive">
                                                                        {errors.pickup_time}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

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
                                                            {(errors.delivery_address ||
                                                                pageErrors?.delivery_address) && (
                                                                <p className="mt-1 text-sm text-destructive">
                                                                    {errors.delivery_address ||
                                                                        pageErrors?.delivery_address}
                                                                </p>
                                                            )}
                                                            {data.delivery_address.trim() !== '' &&
                                                                matchedDelivery && (
                                                                    <p className="mt-1 font-body text-xs text-accent">
                                                                        Matched zone:{' '}
                                                                        {matchedDelivery.name} — $
                                                                        {formatPrice(
                                                                            matchedDelivery.fee,
                                                                        )}{' '}
                                                                        delivery
                                                                    </p>
                                                                )}
                                                            {data.delivery_address.trim() !== '' &&
                                                                !matchedDelivery && (
                                                                    <p className="mt-1 font-body text-xs text-destructive">
                                                                        No delivery zone matches this
                                                                        address yet. Try including your
                                                                        city or contact the store.
                                                                    </p>
                                                                )}
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                            <div>
                                                                <label className="mb-1.5 block font-body text-xs uppercase tracking-wider text-muted-foreground">
                                                                    Preferred Date *
                                                                </label>
                                                                <div className="relative">
                                                                    <Calendar className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                                    <Input
                                                                        required
                                                                        type="date"
                                                                        min={todayDateInput()}
                                                                        value={data.delivery_date}
                                                                        onChange={(event) =>
                                                                            setData(
                                                                                'delivery_date',
                                                                                event.target.value,
                                                                            )
                                                                        }
                                                                        className="h-10 pl-9 font-body text-sm"
                                                                    />
                                                                </div>
                                                                {errors.delivery_date && (
                                                                    <p className="mt-1 text-sm text-destructive">
                                                                        {errors.delivery_date}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <label className="mb-1.5 block font-body text-xs uppercase tracking-wider text-muted-foreground">
                                                                    Preferred Time *
                                                                </label>
                                                                <div className="relative">
                                                                    <Clock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                                    <Input
                                                                        required
                                                                        type="time"
                                                                        value={data.delivery_time}
                                                                        onChange={(event) =>
                                                                            setData(
                                                                                'delivery_time',
                                                                                event.target.value,
                                                                            )
                                                                        }
                                                                        className="h-10 pl-9 font-body text-sm"
                                                                    />
                                                                </div>
                                                                {errors.delivery_time && (
                                                                    <p className="mt-1 text-sm text-destructive">
                                                                        {errors.delivery_time}
                                                                    </p>
                                                                )}
                                                            </div>
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

                                                {method === 'pickup' && (
                                                    <div className="rounded-md border border-border bg-card">
                                                        <button
                                                            type="button"
                                                            onClick={() => setHoursOpen((open) => !open)}
                                                            className="flex w-full items-center justify-between px-4 py-3 text-left"
                                                        >
                                                            <div>
                                                                <p className="font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                                    Store Hours
                                                                </p>
                                                                <p className="mt-0.5 font-body text-sm">
                                                                    {storeSettings.opening_hours ||
                                                                        'Mon–Sat: 11am – 9pm'}
                                                                </p>
                                                            </div>
                                                            <ChevronDown
                                                                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                                                                    hoursOpen ? 'rotate-180' : ''
                                                                }`}
                                                            />
                                                        </button>
                                                        {hoursOpen && (
                                                            <div className="border-t border-border px-4 py-3 font-body text-sm text-muted-foreground">
                                                                <p>
                                                                    {storeSettings.opening_hours ||
                                                                        'Mon–Sat: 11am – 9pm'}
                                                                </p>
                                                                {storeSettings.pickup_message && (
                                                                    <p className="mt-2">
                                                                        Typical ready time:{' '}
                                                                        {storeSettings.pickup_message}
                                                                    </p>
                                                                )}
                                                                <p className="mt-2">
                                                                    Please choose a pickup time
                                                                    during store hours.
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {step === 2 && (
                                                    <Button
                                                        type="button"
                                                        className="font-body text-sm tracking-wide uppercase"
                                                        onClick={() => setStep(3)}
                                                        disabled={
                                                            !data.customer_name ||
                                                            !data.customer_email ||
                                                            (method === 'pickup' &&
                                                                (!data.pickup_date ||
                                                                    !data.pickup_time)) ||
                                                            (method === 'delivery_request' &&
                                                                (!data.delivery_address ||
                                                                    !matchedDelivery ||
                                                                    !data.delivery_date ||
                                                                    !data.delivery_time))
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
                                                    <div className="rounded-md border border-border bg-muted/20 p-5">
                                                        <div className="mb-4 flex items-center gap-2">
                                                            <CreditCard className="h-5 w-5 text-primary" />
                                                            <span className="font-body text-sm font-medium">
                                                                {cashOnDelivery
                                                                    ? 'Pay on Pickup'
                                                                    : 'Online Payment'}
                                                            </span>
                                                        </div>
                                                        <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-md border border-border bg-background p-3">
                                                            <Checkbox
                                                                checked={cashOnDelivery}
                                                                onCheckedChange={(checked) =>
                                                                    setCashOnDelivery(checked === true)
                                                                }
                                                                className="mt-0.5"
                                                            />
                                                            <span className="font-body text-sm">
                                                                Cash on Delivery
                                                            </span>
                                                        </label>
                                                        <p className="mb-4 font-body text-xs text-muted-foreground">
                                                            {cashOnDelivery
                                                                ? 'An order invoice will be sent to you, payable at our Windsor location when you pick up your order.'
                                                                : 'You will be redirected to Stripe to complete payment securely online.'}
                                                        </p>
                                                        {pageErrors?.payment && (
                                                            <p className="mb-3 text-sm text-destructive">
                                                                {pageErrors.payment}
                                                            </p>
                                                        )}
                                                        <Button
                                                            type="submit"
                                                            className="h-12 w-full font-body text-sm tracking-wide uppercase"
                                                            disabled={submitting}
                                                        >
                                                            {submitting
                                                                ? cashOnDelivery
                                                                    ? 'Submitting...'
                                                                    : 'Redirecting...'
                                                                : cashOnDelivery
                                                                  ? 'Submit Request'
                                                                  : 'Proceed to Payment'}
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="rounded-md border border-border bg-muted/20 p-5">
                                                        <div className="mb-4 flex items-center gap-2">
                                                            <Truck className="h-5 w-5 text-primary" />
                                                            <span className="font-body text-sm font-medium">
                                                                Delivery Quote Request
                                                            </span>
                                                        </div>
                                                        <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-md border border-border bg-background p-3">
                                                            <Checkbox
                                                                checked={cashOnDelivery}
                                                                onCheckedChange={(checked) =>
                                                                    setCashOnDelivery(checked === true)
                                                                }
                                                                className="mt-0.5"
                                                            />
                                                            <span className="font-body text-sm">
                                                                Cash on Delivery
                                                            </span>
                                                        </label>
                                                        <p className="mb-4 font-body text-xs text-muted-foreground">
                                                            {cashOnDelivery
                                                                ? 'An order invoice with delivery cost will be sent to you, payable when the goods are delivered to your preferred address'
                                                                : 'You will be redirected to Stripe to complete payment securely online.'}
                                                        </p>
                                                        {pageErrors?.payment && (
                                                            <p className="mb-3 text-sm text-destructive">
                                                                {pageErrors.payment}
                                                            </p>
                                                        )}
                                                        <Button
                                                            type="submit"
                                                            className="h-12 w-full font-body text-sm tracking-wide uppercase"
                                                            disabled={submitting}
                                                        >
                                                            {submitting
                                                                ? cashOnDelivery
                                                                    ? 'Submitting...'
                                                                    : 'Redirecting...'
                                                                : cashOnDelivery
                                                                  ? 'Submit Delivery Request'
                                                                  : 'Proceed to Payment'}
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
                                        {method === 'delivery_request' && (
                                            <div className="flex justify-between font-body text-sm">
                                                <span className="text-muted-foreground">
                                                    Delivery
                                                    {matchedDelivery
                                                        ? ` (${matchedDelivery.name})`
                                                        : ''}
                                                </span>
                                                <span>
                                                    {matchedDelivery
                                                        ? `$${formatPrice(deliveryFee)}`
                                                        : '—'}
                                                </span>
                                            </div>
                                        )}
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
