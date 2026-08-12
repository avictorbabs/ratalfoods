import { Head, useForm, usePage } from '@inertiajs/react';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import AppLayout from '@/layouts/app-layout';
import type { BookingPageContent, SharedData } from '@/types/ratalfoods';

const times = [
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

type ConfirmedBooking = {
    bookingNumber: string;
    email: string;
    date: string;
    time: string;
    guests: number;
};

export default function Bookings({ pageContent }: { pageContent: BookingPageContent }) {
    const { flash } = usePage<SharedData>().props;
    const [confirmed, setConfirmed] = useState<ConfirmedBooking | null>(null);
    const [lastSubmission, setLastSubmission] = useState<Omit<
        ConfirmedBooking,
        'bookingNumber'
    > | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        booking_type: 'dine_in',
        date: '',
        time: '',
        guests: 2,
        occasion: '',
        notes: '',
    });

    useEffect(() => {
        if (flash.bookingNumber && lastSubmission) {
            setConfirmed({
                bookingNumber: flash.bookingNumber,
                ...lastSubmission,
            });
            setLastSubmission(null);
        }
    }, [flash.bookingNumber, lastSubmission]);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        setLastSubmission({
            email: data.customer_email,
            date: data.date,
            time: data.time,
            guests: data.guests,
        });
        post('/bookings', {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    if (confirmed) {
        return (
            <AppLayout>
                <Head title="Booking Confirmed" />
                <div className="flex min-h-screen items-center justify-center px-4 pt-20 pb-20 sm:pt-24">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md text-center"
                    >
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                            <CheckCircle2 className="h-8 w-8 text-accent" />
                        </div>
                        <h2 className="mb-2 font-heading text-3xl">{pageContent.success.heading}</h2>
                        <p className="mb-1 font-body text-sm text-muted-foreground">
                            Booking #{confirmed.bookingNumber}
                        </p>
                        <p className="mb-6 font-body text-sm text-muted-foreground">
                            {confirmed.date} at {confirmed.time} · {confirmed.guests} guest
                            {confirmed.guests > 1 ? 's' : ''}
                        </p>
                        <p className="mb-8 font-body text-sm text-muted-foreground">
                            A confirmation has been sent to{' '}
                            <span className="text-foreground">{confirmed.email}</span>.{' '}
                            {pageContent.success.confirm_copy}
                        </p>
                        <Button
                            onClick={() => setConfirmed(null)}
                            className="font-body text-sm uppercase tracking-wide"
                        >
                            {pageContent.success.cta_label}
                        </Button>
                    </motion.div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Bookings" />

            <div>
                <section className="relative h-64 overflow-hidden sm:h-80">
                    <img
                        src={pageContent.hero.image}
                        alt="Nigerian food spread"
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-foreground/60" />
                    <div className="relative z-10 flex h-full items-center justify-center px-4 pt-16 text-center sm:pt-20">
                        <div>
                            <p className="mb-3 font-body text-xs uppercase tracking-[0.3em] text-background/70">
                                {pageContent.hero.eyebrow}
                            </p>
                            <h1 className="font-heading text-4xl tracking-tight text-background sm:text-5xl">
                                {pageContent.hero.title}
                            </h1>
                            <p className="mx-auto mt-3 max-w-md font-body text-sm text-background/70">
                                {pageContent.hero.body}
                            </p>
                        </div>
                    </div>
                </section>

                <div className="mx-auto max-w-7xl px-4 py-8 pb-20 sm:px-6 lg:px-8">
                    <PageBreadcrumb
                        items={[
                            { title: 'Home', href: '/' },
                            { title: 'Bookings' },
                        ]}
                    />

                    <div className="mb-10 mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {pageContent.types.map((type) => (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => setData('booking_type', type.value)}
                                className={`rounded-md border p-4 text-left transition-all ${
                                    data.booking_type === type.value
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-foreground/20'
                                }`}
                            >
                                <p
                                    className={`font-body text-sm font-medium ${
                                        data.booking_type === type.value ? 'text-primary' : ''
                                    }`}
                                >
                                    {type.label}
                                </p>
                                <p className="mt-1 font-body text-xs text-muted-foreground">
                                    {type.description}
                                </p>
                            </button>
                        ))}
                    </div>

                    <form onSubmit={submit} className="space-y-5">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <label className="mb-1.5 block font-body text-xs uppercase tracking-wider text-muted-foreground">
                                    Full Name
                                </label>
                                <Input
                                    required
                                    value={data.customer_name}
                                    onChange={(event) =>
                                        setData('customer_name', event.target.value)
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
                                    Phone
                                </label>
                                <Input
                                    value={data.customer_phone}
                                    onChange={(event) =>
                                        setData('customer_phone', event.target.value)
                                    }
                                    className="h-10 font-body text-sm"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block font-body text-xs uppercase tracking-wider text-muted-foreground">
                                    Email
                                </label>
                                <Input
                                    required
                                    type="email"
                                    value={data.customer_email}
                                    onChange={(event) =>
                                        setData('customer_email', event.target.value)
                                    }
                                    className="h-10 font-body text-sm"
                                />
                                {errors.customer_email && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {errors.customer_email}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="mb-1.5 block font-body text-xs uppercase tracking-wider text-muted-foreground">
                                    Guests
                                </label>
                                <Input
                                    required
                                    type="number"
                                    min={1}
                                    value={data.guests}
                                    onChange={(event) =>
                                        setData('guests', Number(event.target.value))
                                    }
                                    className="h-10 font-body text-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <label className="mb-1.5 block font-body text-xs uppercase tracking-wider text-muted-foreground">
                                    <Calendar className="mr-1 inline h-3.5 w-3.5" />
                                    Date
                                </label>
                                <Input
                                    required
                                    type="date"
                                    value={data.date}
                                    onChange={(event) => setData('date', event.target.value)}
                                    className="h-10 font-body text-sm"
                                />
                                {errors.date && (
                                    <p className="mt-1 text-sm text-destructive">{errors.date}</p>
                                )}
                            </div>
                            <div>
                                <label className="mb-1.5 block font-body text-xs uppercase tracking-wider text-muted-foreground">
                                    <Clock className="mr-1 inline h-3.5 w-3.5" />
                                    Time
                                </label>
                                <select
                                    required
                                    value={data.time}
                                    onChange={(event) => setData('time', event.target.value)}
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 font-body text-sm"
                                >
                                    <option value="">Select time</option>
                                    {times.map((time) => (
                                        <option key={time} value={time}>
                                            {time}
                                        </option>
                                    ))}
                                </select>
                                {errors.time && (
                                    <p className="mt-1 text-sm text-destructive">{errors.time}</p>
                                )}
                            </div>
                            <div>
                                <label className="mb-1.5 block font-body text-xs uppercase tracking-wider text-muted-foreground">
                                    Occasion
                                </label>
                                <Input
                                    value={data.occasion}
                                    onChange={(event) => setData('occasion', event.target.value)}
                                    placeholder="Birthday, anniversary, corporate event..."
                                    className="h-10 font-body text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block font-body text-xs uppercase tracking-wider text-muted-foreground">
                                Notes
                            </label>
                            <Textarea
                                value={data.notes}
                                onChange={(event) => setData('notes', event.target.value)}
                                rows={4}
                                placeholder="Dietary requirements, seating preferences..."
                                className="font-body text-sm"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={processing}
                            className="h-12 w-full font-body text-sm tracking-wide uppercase sm:w-auto sm:px-10"
                        >
                            {processing ? 'Submitting...' : 'Submit Booking'}
                        </Button>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
