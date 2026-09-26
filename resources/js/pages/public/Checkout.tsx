import GuestSignupCard from '@/components/guest-signup-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { useCart } from '@/lib/cart-store';
import { postJson } from '@/lib/http';
import { formatPrice } from '@/lib/price';
import type { DeliveryFeeZone, OrderComplete, SharedData } from '@/types/ratalfoods';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, BadgePercent, Banknote, Calendar, CheckCircle2, ChevronDown, Clock, CreditCard, House, Store, Truck, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

type CollectionMethod = 'pickup' | 'delivery_request';

const PICKUP_TIMES = ['11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'];

function todayDateInput(): string {
    return new Date().toLocaleDateString('en-CA');
}

function parseMatchTerms(matchTerms: string): string[] {
    return matchTerms
        .split(/[,;\n]+/)
        .map((term) => term.trim())
        .filter(Boolean);
}

function matchDeliveryFee(address: string, zones: DeliveryFeeZone[]): { name: string; fee: number } | null {
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

type PaymentMethod = 'cash_on_delivery' | 'stripe';

export default function Checkout({ deliveryFees = [], stripeEnabled = false }: { deliveryFees?: DeliveryFeeZone[]; stripeEnabled?: boolean }) {
    const { items, subtotal, clearCart, replaceItems } = useCart();
    const { auth, storeSettings, flash, loyalty, errors: pageErrors } = usePage<SharedData & { errors: Record<string, string> }>().props;
    const taxRate = parseFloat(storeSettings.tax_rate) / 100;

    const [step, setStep] = useState(1);
    const [method, setMethod] = useState<CollectionMethod>('pickup');
    const [hoursOpen, setHoursOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
    const cashOnDelivery = paymentMethod === 'cash_on_delivery';
    const [orderComplete, setOrderComplete] = useState<OrderComplete | null>(flash.orderComplete ?? null);

    const [submitting, setSubmitting] = useState(false);
    const pickupLocation =
        storeSettings.address && storeSettings.address.length > 15 ? storeSettings.address : '499 University Ave W, Windsor, ON N9A 5P8';

    const { data, setData, errors } = useForm({
        customer_name: auth.user?.name ?? '',
        customer_email: auth.user?.email ?? '',
        customer_phone: '',
        notes: '',
        delivery_address: '',
        delivery_date: '',
        delivery_time: '',
        pickup_date: '',
        pickup_time: '',
    });

    const [couponInput, setCouponInput] = useState('');
    const [coupon, setCoupon] = useState<{ code: string; description: string; discount: number } | null>(null);
    const [couponError, setCouponError] = useState<string | null>(null);
    const [couponLoading, setCouponLoading] = useState(false);

    const discount = coupon?.discount ?? 0;

    // Repeat orders: pay-on-pickup/delivery only, for signed-in customers with a verified email.
    const [repeatOn, setRepeatOn] = useState(false);
    const [repeatFrequency, setRepeatFrequency] = useState<'weekly' | 'biweekly'>('weekly');
    const [repeatUntil, setRepeatUntil] = useState('');
    const canRepeat = Boolean(auth.user?.email_verified_at) && cashOnDelivery;
    const repeating = repeatOn && canRepeat;

    // Loyalty points: the server re-checks everything, this only previews the saving.
    const [usePoints, setUsePoints] = useState(false);
    const pointsBase = Math.max(0, subtotal - discount);
    const pointsCap = loyalty ? Math.floor((pointsBase * (loyalty.max_percent / 100)) / loyalty.point_value) : 0;
    const pointsAvailable = loyalty && loyalty.balance !== null ? Math.min(loyalty.balance, pointsCap) : 0;
    const canUsePoints = loyalty !== null && loyalty.balance !== null && pointsAvailable >= Math.max(1, loyalty.min_redeem);
    const pointsToUse = usePoints && canUsePoints ? pointsAvailable : 0;
    const loyaltyDiscount = loyalty ? Math.min(Math.floor(pointsToUse * loyalty.point_value * 100) / 100, pointsBase) : 0;
    const pointsEarned = loyalty ? Math.floor(Math.max(0, pointsBase - loyaltyDiscount) * loyalty.points_per_dollar) : 0;

    const tax = (subtotal - discount - loyaltyDiscount) * taxRate;
    const matchedDelivery = method === 'delivery_request' ? matchDeliveryFee(data.delivery_address, deliveryFees) : null;
    const deliveryFee = matchedDelivery?.fee ?? 0;
    const total = subtotal - discount - loyaltyDiscount + tax + deliveryFee;

    const cartPayload = items.map((item) => ({ product_id: item.product_id, quantity: item.quantity }));

    const checkCoupon = async (code: string, silent = false) => {
        if (!code.trim() || items.length === 0) {
            return;
        }

        setCouponLoading(true);
        const response = await postJson<{ code: string; description: string; discount: number; message?: string }>('/coupons/validate', {
            code,
            email: data.customer_email || null,
            items: cartPayload,
        });
        setCouponLoading(false);

        if (response.ok) {
            setCoupon({ code: response.data.code, description: response.data.description, discount: response.data.discount });
            setCouponError(null);
            setCouponInput('');
        } else {
            setCoupon(null);
            setCouponError(response.data.message ?? 'That coupon could not be applied.');
            if (silent) {
                setCouponInput(code);
            }
        }
    };

    // Keep the saving in step with the cart and email (some coupons are tied to an email address).
    useEffect(() => {
        if (coupon) {
            void checkCoupon(coupon.code, true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subtotal, data.customer_email]);

    // Restore a cart from an abandoned-cart reminder email.
    useEffect(() => {
        const recovered = flash.recoveredCart;

        if (recovered) {
            replaceItems(recovered.items);
            if (!data.customer_email) {
                setData('customer_email', recovered.email);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flash.recoveredCart]);

    // Once we have an email, remember the cart so we can send a reminder if the order is never finished.
    useEffect(() => {
        if (orderComplete || !/^\S+@\S+\.\S+$/.test(data.customer_email)) {
            return;
        }

        const timer = window.setTimeout(() => {
            void postJson('/cart/capture', { email: data.customer_email, name: data.customer_name || null, items: cartPayload });
        }, 1500);

        return () => window.clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.customer_email, JSON.stringify(cartPayload), orderComplete]);

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
                payment_method: paymentMethod,
                coupon_code: coupon?.code ?? null,
                use_points: pointsToUse > 0,
                repeat: repeating ? repeatFrequency : null,
                repeat_until: repeating && repeatUntil ? repeatUntil : null,
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

    const paymentChoices: { value: PaymentMethod; label: string; description: string; icon: typeof Banknote }[] = [
        {
            value: 'cash_on_delivery',
            label: method === 'pickup' ? 'Pay at Pickup' : 'Cash on Delivery',
            description: method === 'pickup' ? 'Pay with cash when you collect your order' : 'Pay with cash when your order arrives',
            icon: Banknote,
        },
        ...(stripeEnabled
            ? [
                  {
                      value: 'stripe' as const,
                      label: 'Pay Online',
                      description: 'Card, Apple Pay or Google Pay via Stripe',
                      icon: CreditCard,
                  },
              ]
            : []),
    ];

    const paymentOptions = (
        <div role="radiogroup" aria-label="Payment method" className="mb-4 grid gap-3 sm:grid-cols-2">
            {paymentChoices.map((choice) => {
                const selected = paymentMethod === choice.value;
                const Icon = choice.icon;

                return (
                    <button
                        key={choice.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setPaymentMethod(choice.value)}
                        className={`flex items-start gap-3 rounded-md border p-3 text-left transition-colors ${
                            selected ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-primary/50'
                        }`}
                    >
                        <span
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                selected ? 'border-primary' : 'border-muted-foreground/40'
                            }`}
                        >
                            {selected && <span className="bg-primary h-2 w-2 rounded-full" />}
                        </span>
                        <span>
                            <span className="font-body flex items-center gap-2 text-sm font-medium">
                                <Icon className="text-primary h-4 w-4" />
                                {choice.label}
                            </span>
                            <span className="font-body text-muted-foreground mt-0.5 block text-xs">{choice.description}</span>
                        </span>
                    </button>
                );
            })}
        </div>
    );

    if (orderComplete) {
        return (
            <AppLayout>
                <Head title="Order Confirmed" />
                <div className="px-4 pt-20 pb-20 sm:pt-24">
                    <div className="border-border mx-auto my-10 max-w-lg rounded-md border bg-white p-6 text-center shadow-sm sm:p-10">
                        <div className="mb-3 flex items-center justify-center gap-3">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15 }}>
                                <CheckCircle2 className="text-accent h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
                            </motion.div>
                            <h1 className="font-heading text-3xl tracking-tight sm:text-4xl">Order Confirmed</h1>
                        </div>
                        <p className="font-body text-muted-foreground mb-2">Thank you, {orderComplete.customer_name}!</p>
                        <div className="border-border bg-card mt-8 rounded-md border p-6 text-left">
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <p className="font-body text-muted-foreground text-xs tracking-wider uppercase">Order Number</p>
                                    <p className="font-heading mt-1 text-xl">{orderComplete.order_number}</p>
                                </div>
                                <div className="bg-accent/10 rounded-sm px-3 py-1">
                                    <span className="font-body text-accent text-xs font-medium uppercase">
                                        {orderComplete.collection_method === 'pickup' ? 'Pickup' : 'Delivery Request'}
                                    </span>
                                </div>
                            </div>

                            {orderComplete.collection_method === 'pickup' && (
                                <div className="bg-accent/5 mb-4 space-y-2 rounded-md p-3">
                                    <div className="flex items-center gap-2">
                                        <Store className="text-accent h-4 w-4 shrink-0" />
                                        <span className="font-body text-accent text-sm">
                                            {orderComplete.pickup_time ? `Pickup ${orderComplete.pickup_time}` : 'Store pickup'}
                                        </span>
                                    </div>
                                    <p className="font-body text-muted-foreground pl-6 text-xs">{pickupLocation}</p>
                                </div>
                            )}

                            {orderComplete.collection_method === 'delivery_request' && (
                                <div className="bg-primary/5 mb-4 flex items-center gap-2 rounded-md p-3">
                                    <Truck className="text-primary h-4 w-4" />
                                    <span className="font-body text-primary text-sm">
                                        Please check your email for your order details. Also we may call you if further clarification is needed.
                                    </span>
                                </div>
                            )}

                            <div className="border-border space-y-2 border-t pt-4">
                                <div className="font-body flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>${formatPrice(orderComplete.subtotal)}</span>
                                </div>
                                {(orderComplete.discount ?? 0) > 0 && (
                                    <div className="font-body flex justify-between text-sm text-emerald-700">
                                        <span>Discount{orderComplete.coupon_code ? ` (${orderComplete.coupon_code})` : ''}</span>
                                        <span>-${formatPrice(orderComplete.discount ?? 0)}</span>
                                    </div>
                                )}
                                <div className="font-body flex justify-between text-sm">
                                    <span className="text-muted-foreground">Tax ({storeSettings.tax_rate}%)</span>
                                    <span>${formatPrice(orderComplete.tax)}</span>
                                </div>
                                {(orderComplete.delivery_fee ?? 0) > 0 && (
                                    <div className="font-body flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Delivery
                                            {orderComplete.delivery_zone ? ` (${orderComplete.delivery_zone})` : ''}
                                        </span>
                                        <span>${formatPrice(orderComplete.delivery_fee ?? 0)}</span>
                                    </div>
                                )}
                                <div className="border-border font-body flex justify-between border-t pt-2 text-base font-semibold">
                                    <span>Total</span>
                                    <span>${formatPrice(orderComplete.total)}</span>
                                </div>
                            </div>
                        </div>

                        <p className="font-body text-muted-foreground mt-6 text-xs">A confirmation has been sent to {orderComplete.customer_email}</p>
                        {orderComplete.tracking_url && (
                            <Button asChild variant="outline" className="mt-4 w-full">
                                <a href={orderComplete.tracking_url}>Track your order</a>
                            </Button>
                        )}
                        {orderComplete.guest_signup && <GuestSignupCard hasAccount={orderComplete.guest_signup.has_account} kind="order" />}

                        <Button className="font-body mt-8 text-sm tracking-wide uppercase" asChild>
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
                        <h1 className="font-heading mb-3 text-3xl tracking-tight sm:text-4xl">Your cart is empty</h1>
                        <p className="font-body text-muted-foreground mb-8">Add items from the menu before checking out.</p>
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
                        <h1 className="font-heading text-3xl tracking-tight sm:text-4xl">Checkout</h1>
                        <Link
                            href="/menu"
                            className="font-body text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-1.5 text-sm transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Menu
                        </Link>
                    </div>

                    <form onSubmit={placeOrder}>
                        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5 lg:gap-16">
                            <div className="border-border space-y-8 rounded-md border bg-white p-6 sm:p-8 lg:col-span-3">
                                <div className="space-y-4">
                                    <button type="button" onClick={() => setStep(1)} className="flex w-full items-center gap-3 text-left">
                                        <span
                                            className={`font-body flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                                                step >= 1 ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            1
                                        </span>
                                        <span className="font-body text-sm font-medium tracking-wider uppercase">Collection Method</span>
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
                                                                method === 'pickup' ? 'text-primary' : 'text-muted-foreground'
                                                            }`}
                                                        />
                                                        <h4 className="font-body text-sm font-medium">Store Pickup</h4>
                                                        <p className="font-body text-muted-foreground mt-1 text-xs">
                                                            Pick up from our Windsor location
                                                        </p>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setMethod('delivery_request')}
                                                        className={`rounded-md border-2 p-5 text-left transition-all ${
                                                            method === 'delivery_request'
                                                                ? 'border-primary bg-primary/5'
                                                                : 'border-border hover:border-foreground/20'
                                                        }`}
                                                    >
                                                        <Truck
                                                            className={`mb-2 h-5 w-5 ${
                                                                method === 'delivery_request' ? 'text-primary' : 'text-muted-foreground'
                                                            }`}
                                                        />
                                                        <h4 className="font-body text-sm font-medium">Delivery Request</h4>
                                                        <p className="font-body text-muted-foreground mt-1 text-xs">
                                                            We&apos;ll contact you with delivery details
                                                        </p>
                                                    </button>
                                                </div>

                                                {step === 1 && (
                                                    <Button
                                                        type="button"
                                                        className="font-body mt-4 text-sm tracking-wide uppercase"
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
                                    <button type="button" onClick={() => step > 1 && setStep(2)} className="flex w-full items-center gap-3 text-left">
                                        <span
                                            className={`font-body flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                                                step >= 2 ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            2
                                        </span>
                                        <span className="font-body text-sm font-medium tracking-wider uppercase">Your Details</span>
                                    </button>

                                    <AnimatePresence>
                                        {step >= 2 && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="ml-10 space-y-4 overflow-hidden"
                                            >
                                                {!auth.user && (
                                                    <p className="font-body text-muted-foreground text-sm">
                                                        Have an account?{' '}
                                                        <Link href="/login" className="text-primary hover:underline">
                                                            Log in
                                                        </Link>{' '}
                                                        for faster checkout.
                                                    </p>
                                                )}
                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                    <div>
                                                        <label className="font-body text-muted-foreground mb-1.5 block text-xs tracking-wider uppercase">
                                                            Full Name *
                                                        </label>
                                                        <Input
                                                            required
                                                            value={data.customer_name}
                                                            onChange={(event) => setData('customer_name', event.target.value)}
                                                            className="font-body h-10 text-sm"
                                                        />
                                                        {errors.customer_name && (
                                                            <p className="text-destructive mt-1 text-sm">{errors.customer_name}</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="font-body text-muted-foreground mb-1.5 block text-xs tracking-wider uppercase">
                                                            Email *
                                                        </label>
                                                        <Input
                                                            required
                                                            type="email"
                                                            value={data.customer_email}
                                                            onChange={(event) => setData('customer_email', event.target.value)}
                                                            className="font-body h-10 text-sm"
                                                        />
                                                        {errors.customer_email && (
                                                            <p className="text-destructive mt-1 text-sm">{errors.customer_email}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="font-body text-muted-foreground mb-1.5 block text-xs tracking-wider uppercase">
                                                        Phone *
                                                    </label>
                                                    <Input
                                                        required
                                                        value={data.customer_phone}
                                                        onChange={(event) => setData('customer_phone', event.target.value)}
                                                        className="font-body h-10 text-sm"
                                                    />
                                                    {errors.customer_phone && (
                                                        <p className="text-destructive mt-1 text-sm">{errors.customer_phone}</p>
                                                    )}
                                                </div>

                                                {method === 'pickup' && (
                                                    <>
                                                        <div>
                                                            <label className="font-body text-muted-foreground mb-1.5 block text-xs tracking-wider uppercase">
                                                                Pickup Location
                                                            </label>
                                                            <div className="relative">
                                                                <House className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                                                <Input
                                                                    readOnly
                                                                    value={pickupLocation}
                                                                    className="bg-muted/40 font-body h-10 pr-3 pl-9 text-sm"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                            <div>
                                                                <label className="font-body text-muted-foreground mb-1.5 block text-xs tracking-wider uppercase">
                                                                    Pickup Date *
                                                                </label>
                                                                <div className="relative">
                                                                    <Calendar className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                                                    <Input
                                                                        required
                                                                        type="date"
                                                                        min={todayDateInput()}
                                                                        value={data.pickup_date}
                                                                        onChange={(event) => setData('pickup_date', event.target.value)}
                                                                        className="font-body h-10 pl-9 text-sm"
                                                                    />
                                                                </div>
                                                                {errors.pickup_date && (
                                                                    <p className="text-destructive mt-1 text-sm">{errors.pickup_date}</p>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <label className="font-body text-muted-foreground mb-1.5 block text-xs tracking-wider uppercase">
                                                                    Preferred Pickup Time *
                                                                </label>
                                                                <div className="relative">
                                                                    <Clock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2" />
                                                                    <select
                                                                        required
                                                                        value={data.pickup_time}
                                                                        onChange={(event) => setData('pickup_time', event.target.value)}
                                                                        className="border-input bg-background font-body h-10 w-full appearance-none rounded-md border py-2 pr-8 pl-9 text-sm"
                                                                    >
                                                                        <option value="">Select time</option>
                                                                        {PICKUP_TIMES.map((time) => (
                                                                            <option key={time} value={time}>
                                                                                {time}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
                                                                </div>
                                                                {errors.pickup_time && (
                                                                    <p className="text-destructive mt-1 text-sm">{errors.pickup_time}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                {method === 'delivery_request' && (
                                                    <>
                                                        <div>
                                                            <label className="font-body text-muted-foreground mb-1.5 block text-xs tracking-wider uppercase">
                                                                Delivery Address *
                                                            </label>
                                                            <Input
                                                                required
                                                                value={data.delivery_address}
                                                                onChange={(event) => setData('delivery_address', event.target.value)}
                                                                placeholder="Full address"
                                                                className="font-body h-10 text-sm"
                                                            />
                                                            {(errors.delivery_address || pageErrors?.delivery_address) && (
                                                                <p className="text-destructive mt-1 text-sm">
                                                                    {errors.delivery_address || pageErrors?.delivery_address}
                                                                </p>
                                                            )}
                                                            {data.delivery_address.trim() !== '' && matchedDelivery && (
                                                                <p className="font-body text-accent mt-1 text-xs">
                                                                    Matched zone: {matchedDelivery.name} — ${formatPrice(matchedDelivery.fee)}{' '}
                                                                    delivery
                                                                </p>
                                                            )}
                                                            {data.delivery_address.trim() !== '' && !matchedDelivery && (
                                                                <p className="font-body text-destructive mt-1 text-xs">
                                                                    No delivery zone matches this address yet. Try including your city or contact the
                                                                    store.
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                            <div>
                                                                <label className="font-body text-muted-foreground mb-1.5 block text-xs tracking-wider uppercase">
                                                                    Preferred Date *
                                                                </label>
                                                                <div className="relative">
                                                                    <Calendar className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                                                    <Input
                                                                        required
                                                                        type="date"
                                                                        min={todayDateInput()}
                                                                        value={data.delivery_date}
                                                                        onChange={(event) => setData('delivery_date', event.target.value)}
                                                                        className="font-body h-10 pl-9 text-sm"
                                                                    />
                                                                </div>
                                                                {errors.delivery_date && (
                                                                    <p className="text-destructive mt-1 text-sm">{errors.delivery_date}</p>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <label className="font-body text-muted-foreground mb-1.5 block text-xs tracking-wider uppercase">
                                                                    Preferred Time *
                                                                </label>
                                                                <div className="relative">
                                                                    <Clock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                                                    <Input
                                                                        required
                                                                        type="time"
                                                                        value={data.delivery_time}
                                                                        onChange={(event) => setData('delivery_time', event.target.value)}
                                                                        className="font-body h-10 pl-9 text-sm"
                                                                    />
                                                                </div>
                                                                {errors.delivery_time && (
                                                                    <p className="text-destructive mt-1 text-sm">{errors.delivery_time}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                <div>
                                                    <label className="font-body text-muted-foreground mb-1.5 block text-xs tracking-wider uppercase">
                                                        Order Notes
                                                    </label>
                                                    <Textarea
                                                        value={data.notes}
                                                        onChange={(event) => setData('notes', event.target.value)}
                                                        rows={2}
                                                        placeholder="Any special requests..."
                                                        className="font-body text-sm"
                                                    />
                                                </div>

                                                {method === 'pickup' && (
                                                    <div className="border-border bg-card rounded-md border">
                                                        <button
                                                            type="button"
                                                            onClick={() => setHoursOpen((open) => !open)}
                                                            className="flex w-full items-center justify-between px-4 py-3 text-left"
                                                        >
                                                            <div>
                                                                <p className="font-body text-muted-foreground text-xs font-medium tracking-wider uppercase">
                                                                    Store Hours
                                                                </p>
                                                                <p className="font-body mt-0.5 text-sm">
                                                                    {storeSettings.opening_hours || 'Mon–Sat: 11am – 9pm'}
                                                                </p>
                                                            </div>
                                                            <ChevronDown
                                                                className={`text-muted-foreground h-4 w-4 shrink-0 transition-transform ${
                                                                    hoursOpen ? 'rotate-180' : ''
                                                                }`}
                                                            />
                                                        </button>
                                                        {hoursOpen && (
                                                            <div className="border-border font-body text-muted-foreground border-t px-4 py-3 text-sm">
                                                                <p>{storeSettings.opening_hours || 'Mon–Sat: 11am – 9pm'}</p>
                                                                {storeSettings.pickup_message && (
                                                                    <p className="mt-2">Typical ready time: {storeSettings.pickup_message}</p>
                                                                )}
                                                                <p className="mt-2">Please choose a pickup time during store hours.</p>
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
                                                            (method === 'pickup' && (!data.pickup_date || !data.pickup_time)) ||
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
                                    <button type="button" onClick={() => step > 2 && setStep(3)} className="flex w-full items-center gap-3 text-left">
                                        <span
                                            className={`font-body flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                                                step >= 3 ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            3
                                        </span>
                                        <span className="font-body text-sm font-medium tracking-wider uppercase">
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
                                                    <div className="border-border bg-muted/20 rounded-md border p-5">
                                                        <div className="mb-4 flex items-center gap-2">
                                                            <CreditCard className="text-primary h-5 w-5" />
                                                            <span className="font-body text-sm font-medium">Payment Method</span>
                                                        </div>
                                                        {paymentOptions}
                                                        <p className="font-body text-muted-foreground mb-4 text-xs">
                                                            {cashOnDelivery
                                                                ? 'An order invoice will be sent to you, payable at our Windsor location when you pick up your order.'
                                                                : 'You will be redirected to Stripe to complete payment securely online.'}
                                                        </p>
                                                        {pageErrors?.payment && <p className="text-destructive mb-3 text-sm">{pageErrors.payment}</p>}
                                                        <Button
                                                            type="submit"
                                                            className="font-body h-12 w-full text-sm tracking-wide uppercase"
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
                                                    <div className="border-border bg-muted/20 rounded-md border p-5">
                                                        <div className="mb-4 flex items-center gap-2">
                                                            <Truck className="text-primary h-5 w-5" />
                                                            <span className="font-body text-sm font-medium">Delivery Quote Request</span>
                                                        </div>
                                                        {paymentOptions}
                                                        <p className="font-body text-muted-foreground mb-4 text-xs">
                                                            {cashOnDelivery
                                                                ? 'An order invoice with delivery cost will be sent to you, payable when the goods are delivered to your preferred address'
                                                                : 'You will be redirected to Stripe to complete payment securely online.'}
                                                        </p>
                                                        {pageErrors?.payment && <p className="text-destructive mb-3 text-sm">{pageErrors.payment}</p>}
                                                        <Button
                                                            type="submit"
                                                            className="font-body h-12 w-full text-sm tracking-wide uppercase"
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
                                <div className="border-border rounded-md border bg-white p-6 lg:sticky lg:top-24">
                                    <h3 className="font-heading mb-6 text-lg">Order Summary</h3>
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
                                                    <p className="font-body truncate text-sm">{item.product_name}</p>
                                                    <p className="font-body text-muted-foreground text-xs">Qty: {item.quantity}</p>
                                                </div>
                                                <p className="font-body text-sm font-medium">${formatPrice(item.price * item.quantity)}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-border border-t pt-4">
                                        {coupon ? (
                                            <div className="bg-primary/10 font-body flex items-center justify-between rounded-md px-3 py-2 text-sm">
                                                <span className="flex items-center gap-2">
                                                    <BadgePercent className="text-primary h-4 w-4" />
                                                    <span>
                                                        <span className="font-semibold">{coupon.code}</span> · {coupon.description}
                                                    </span>
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setCoupon(null)}
                                                    className="text-muted-foreground hover:text-foreground"
                                                    aria-label="Remove coupon"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={couponInput}
                                                        onChange={(event) => setCouponInput(event.target.value)}
                                                        onKeyDown={(event) => {
                                                            if (event.key === 'Enter') {
                                                                event.preventDefault();
                                                                void checkCoupon(couponInput);
                                                            }
                                                        }}
                                                        placeholder="Coupon code"
                                                        className="font-body h-10 text-sm uppercase"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        disabled={couponLoading || couponInput.trim() === ''}
                                                        onClick={() => void checkCoupon(couponInput)}
                                                    >
                                                        {couponLoading ? 'Checking…' : 'Apply'}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                        {(couponError || pageErrors.coupon_code) && (
                                            <p className="text-destructive mt-2 text-sm">{couponError ?? pageErrors.coupon_code}</p>
                                        )}
                                    </div>

                                    {loyalty && (
                                        <div className="border-border border-t pt-4">
                                            {loyalty.balance === null ? (
                                                <p className="font-body text-muted-foreground text-sm">
                                                    {auth.user ? (
                                                        'Verify your email to earn and use loyalty points.'
                                                    ) : (
                                                        <>
                                                            <Link href="/login" className="text-primary hover:underline">
                                                                Log in
                                                            </Link>{' '}
                                                            to earn about {pointsEarned.toLocaleString()} points on this order.
                                                        </>
                                                    )}
                                                </p>
                                            ) : canUsePoints ? (
                                                <label className="font-body flex cursor-pointer items-start gap-3 text-sm">
                                                    <input
                                                        type="checkbox"
                                                        checked={usePoints}
                                                        onChange={(event) => setUsePoints(event.target.checked)}
                                                        className="mt-1"
                                                    />
                                                    <span>
                                                        Use {pointsAvailable.toLocaleString()} of my {loyalty.balance.toLocaleString()} points (saves
                                                        ${formatPrice(Math.floor(pointsAvailable * loyalty.point_value * 100) / 100)})
                                                        <span className="text-muted-foreground block text-xs">
                                                            You will earn about {pointsEarned.toLocaleString()} points on this order.
                                                        </span>
                                                    </span>
                                                </label>
                                            ) : (
                                                <p className="font-body text-muted-foreground text-sm">
                                                    You have {loyalty.balance.toLocaleString()} points. Points can be used once you have{' '}
                                                    {loyalty.min_redeem.toLocaleString()}. You will earn about {pointsEarned.toLocaleString()} on this
                                                    order.
                                                </p>
                                            )}
                                            {pageErrors.use_points && <p className="text-destructive mt-2 text-sm">{pageErrors.use_points}</p>}
                                        </div>
                                    )}

                                    <div className="border-border border-t pt-4">
                                        {auth.user?.email_verified_at ? (
                                            <>
                                                <label
                                                    className={`font-body flex items-start gap-3 text-sm ${cashOnDelivery ? 'cursor-pointer' : 'opacity-60'}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={repeating}
                                                        disabled={!cashOnDelivery}
                                                        onChange={(event) => setRepeatOn(event.target.checked)}
                                                        className="mt-1"
                                                    />
                                                    <span>
                                                        Repeat this order
                                                        <span className="text-muted-foreground block text-xs">
                                                            {cashOnDelivery
                                                                ? 'Handy for office lunches and weekly favourites. Pay on pickup or delivery.'
                                                                : 'Repeat orders are pay on pickup or delivery for now. Choose that payment option to repeat.'}
                                                        </span>
                                                    </span>
                                                </label>

                                                {repeating && (
                                                    <div className="mt-3 space-y-3 pl-7">
                                                        <div className="grid gap-3 sm:grid-cols-2">
                                                            <div>
                                                                <label className="font-body text-muted-foreground mb-1 block text-xs tracking-wider uppercase">
                                                                    How often
                                                                </label>
                                                                <select
                                                                    value={repeatFrequency}
                                                                    onChange={(event) =>
                                                                        setRepeatFrequency(event.target.value as 'weekly' | 'biweekly')
                                                                    }
                                                                    className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                                                                >
                                                                    <option value="weekly">Every week</option>
                                                                    <option value="biweekly">Every 2 weeks</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="font-body text-muted-foreground mb-1 block text-xs tracking-wider uppercase">
                                                                    Stop after (optional)
                                                                </label>
                                                                <Input
                                                                    type="date"
                                                                    value={repeatUntil}
                                                                    onChange={(event) => setRepeatUntil(event.target.value)}
                                                                    className="h-10 text-sm"
                                                                />
                                                            </div>
                                                        </div>
                                                        <p className="font-body text-muted-foreground text-xs">
                                                            We create each order 2 days ahead and email you a link to skip it. You can pause or cancel
                                                            any time in your account.
                                                        </p>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <p className="font-body text-muted-foreground text-sm">
                                                {auth.user ? (
                                                    'Verify your email to set up repeat orders.'
                                                ) : (
                                                    <>
                                                        <Link href="/login" className="text-primary hover:underline">
                                                            Log in
                                                        </Link>{' '}
                                                        to repeat this order every week.
                                                    </>
                                                )}
                                            </p>
                                        )}
                                        {pageErrors.repeat && <p className="text-destructive mt-2 text-sm">{pageErrors.repeat}</p>}
                                    </div>

                                    <div className="border-border space-y-2 border-t pt-4">
                                        <div className="font-body flex justify-between text-sm">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span>${formatPrice(subtotal)}</span>
                                        </div>
                                        {discount > 0 && (
                                            <div className="font-body flex justify-between text-sm text-emerald-700">
                                                <span>Discount ({coupon?.code})</span>
                                                <span>-${formatPrice(discount)}</span>
                                            </div>
                                        )}
                                        {loyaltyDiscount > 0 && (
                                            <div className="font-body flex justify-between text-sm text-emerald-700">
                                                <span>Points ({pointsToUse.toLocaleString()})</span>
                                                <span>-${formatPrice(loyaltyDiscount)}</span>
                                            </div>
                                        )}
                                        <div className="font-body flex justify-between text-sm">
                                            <span className="text-muted-foreground">Tax ({storeSettings.tax_rate}%)</span>
                                            <span>${formatPrice(tax)}</span>
                                        </div>
                                        {method === 'delivery_request' && (
                                            <div className="font-body flex justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    Delivery
                                                    {matchedDelivery ? ` (${matchedDelivery.name})` : ''}
                                                </span>
                                                <span>{matchedDelivery ? `$${formatPrice(deliveryFee)}` : '—'}</span>
                                            </div>
                                        )}
                                        <div className="border-border font-body flex justify-between border-t pt-2 text-base font-semibold">
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
