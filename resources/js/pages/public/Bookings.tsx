import GuestSignupCard from '@/components/guest-signup-card';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import Recaptcha from '@/components/recaptcha';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BookingPageContent, SharedData } from '@/types/ratalfoods';
import { Head, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import type ReCAPTCHA from 'react-google-recaptcha';

const times = ['11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'];

type ConfirmedBooking = {
    bookingNumber: string;
    email: string;
    date: string;
    time: string;
    guests: number | null;
    bookingType: string;
    guestSignup?: { has_account: boolean } | null;
};

export default function Bookings({ pageContent }: { pageContent: BookingPageContent }) {
    const { flash } = usePage<SharedData>().props;
    const [confirmed, setConfirmed] = useState<ConfirmedBooking | null>(null);
    const [lastSubmission, setLastSubmission] = useState<Omit<ConfirmedBooking, 'bookingNumber'> | null>(null);

    const { data, setData, post, processing, errors, reset, transform } = useForm({
        recaptcha: '',
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

    const recaptchaRef = useRef<ReCAPTCHA>(null);
    const resetCaptcha = () => {
        recaptchaRef.current?.reset();
        setData('recaptcha', '');
    };

    useEffect(() => {
        if (flash.bookingNumber && lastSubmission) {
            setConfirmed({
                bookingNumber: flash.bookingNumber,
                guestSignup: flash.guestSignup ?? null,
                ...lastSubmission,
            });
            setLastSubmission(null);
        }
    }, [flash.bookingNumber, lastSubmission]);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const isCatering = data.booking_type === 'catering';

        setLastSubmission({
            email: data.customer_email,
            date: data.date,
            time: data.time,
            guests: isCatering ? null : data.guests,
            bookingType: data.booking_type,
        });

        transform((formData) => ({
            ...formData,
            guests: isCatering ? null : formData.guests,
        }));

        post('/bookings', {
            onFinish: resetCaptcha,
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
                        className="border-border w-full max-w-md rounded-md border bg-white p-8 text-center shadow-sm sm:p-10"
                    >
                        <div className="bg-accent/10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
                            <CheckCircle2 className="text-accent h-8 w-8" />
                        </div>
                        <h2 className="font-heading mb-2 text-3xl">{pageContent.success.heading}</h2>
                        <p className="font-body text-muted-foreground mb-1 text-sm">Booking #{confirmed.bookingNumber}</p>
                        <p className="font-body text-muted-foreground mb-6 text-sm">
                            {confirmed.date} at {confirmed.time}
                            {confirmed.guests !== null && (
                                <>
                                    {' · '}
                                    {confirmed.guests} {confirmed.bookingType === 'dine_in' ? 'table' : 'guest'}
                                    {confirmed.guests > 1 ? 's' : ''}
                                </>
                            )}
                        </p>
                        <p className="font-body text-muted-foreground mb-8 text-sm">
                            A confirmation has been sent to <span className="text-foreground">{confirmed.email}</span>.{' '}
                            {pageContent.success.confirm_copy}
                        </p>
                        <Button onClick={() => setConfirmed(null)} className="font-body text-sm tracking-wide uppercase">
                            {pageContent.success.cta_label}
                        </Button>
                        {confirmed.guestSignup && <GuestSignupCard hasAccount={confirmed.guestSignup.has_account} kind="booking" />}
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
                    <img src={pageContent.hero.image} alt="Nigerian food spread" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="bg-foreground/60 absolute inset-0" />
                    <div className="relative z-10 flex h-full items-center justify-center px-4 pt-16 text-center sm:pt-20">
                        <div>
                            <p className="font-body text-background/70 mb-3 text-xs tracking-[0.3em] uppercase">{pageContent.hero.eyebrow}</p>
                            <h1 className="font-heading text-background text-4xl tracking-tight sm:text-5xl">{pageContent.hero.title}</h1>
                            <p className="font-body text-background/70 mx-auto mt-3 max-w-md text-sm">{pageContent.hero.body}</p>
                        </div>
                    </div>
                </section>

                <div className="mx-auto max-w-7xl px-4 py-8 pb-20 sm:px-6 lg:px-8">
                    <PageBreadcrumb items={[{ title: 'Home', href: '/' }, { title: 'Bookings' }]} />

                    <div className="border-border mt-6 rounded-md border bg-white p-6 shadow-sm sm:p-8">
                        <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {pageContent.types.map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setData('booking_type', type.value)}
                                    className={`rounded-md border p-4 text-left transition-all ${
                                        data.booking_type === type.value ? 'border-primary bg-primary/5' : 'border-border hover:border-foreground/20'
                                    }`}
                                >
                                    <p className={`font-body text-sm font-medium ${data.booking_type === type.value ? 'text-primary' : ''}`}>
                                        {type.label}
                                    </p>
                                    <p className="font-body text-muted-foreground mt-1 text-xs">{type.description}</p>
                                </button>
                            ))}
                        </div>

                        <form onSubmit={submit} className="space-y-5">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <label className="font-body text-muted-foreground mb-1.5 block text-xs tracking-wider uppercase">
                                        Full Name<span className="text-destructive ml-0.5">*</span>
                                    </label>
                                    <Input
                                        required
                                        value={data.customer_name}
                                        onChange={(event) => setData('customer_name', event.target.value)}
                                        className="font-body h-10 text-sm"
                                    />
                                    {errors.customer_name && <p className="text-destructive mt-1 text-sm">{errors.customer_name}</p>}
                                </div>
                                <div>
                                    <label className="font-body text-muted-foreground mb-1.5 block text-xs tracking-wider uppercase">
                                        Phone<span className="text-destructive ml-0.5">*</span>
                                    </label>
                                    <Input
                                        required
                                        value={data.customer_phone}
                                        onChange={(event) => setData('customer_phone', event.target.value)}
                                        className="font-body h-10 text-sm"
                                    />
                                    {errors.customer_phone && <p className="text-destructive mt-1 text-sm">{errors.customer_phone}</p>}
                                </div>
                                <div>
                                    <label className="font-body text-muted-foreground mb-1.5 block text-xs tracking-wider uppercase">
                                        Email<span className="text-destructive ml-0.5">*</span>
                                    </label>
                                    <Input
                                        required
                                        type="email"
                                        value={data.customer_email}
                                        onChange={(event) => setData('customer_email', event.target.value)}
                                        className="font-body h-10 text-sm"
                                    />
                                    {errors.customer_email && <p className="text-destructive mt-1 text-sm">{errors.customer_email}</p>}
                                </div>
                                {data.booking_type !== 'catering' && (
                                    <div>
                                        <label className="font-body text-muted-foreground mb-1.5 block text-xs tracking-wider uppercase">
                                            {data.booking_type === 'dine_in' ? 'Table Count' : 'Guests'}
                                            <span className="text-destructive ml-0.5">*</span>
                                        </label>
                                        <Input
                                            required
                                            type="number"
                                            min={1}
                                            value={data.guests}
                                            onChange={(event) => setData('guests', Number(event.target.value))}
                                            className="font-body h-10 text-sm"
                                        />
                                        {errors.guests && <p className="text-destructive mt-1 text-sm">{errors.guests}</p>}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div>
                                    <label className="font-body text-muted-foreground mb-1.5 block text-xs tracking-wider uppercase">
                                        <Calendar className="mr-1 inline h-3.5 w-3.5" />
                                        Date<span className="text-destructive ml-0.5">*</span>
                                    </label>
                                    <Input
                                        required
                                        type="date"
                                        value={data.date}
                                        onChange={(event) => setData('date', event.target.value)}
                                        className="font-body h-10 text-sm"
                                    />
                                    {errors.date && <p className="text-destructive mt-1 text-sm">{errors.date}</p>}
                                </div>
                                <div>
                                    <label className="font-body text-muted-foreground mb-1.5 block text-xs tracking-wider uppercase">
                                        <Clock className="mr-1 inline h-3.5 w-3.5" />
                                        Time<span className="text-destructive ml-0.5">*</span>
                                    </label>
                                    <select
                                        required
                                        value={data.time}
                                        onChange={(event) => setData('time', event.target.value)}
                                        className="border-input bg-background font-body h-10 w-full rounded-md border px-3 text-sm"
                                    >
                                        <option value="">Select time</option>
                                        {times.map((time) => (
                                            <option key={time} value={time}>
                                                {time}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.time && <p className="text-destructive mt-1 text-sm">{errors.time}</p>}
                                </div>
                                <div>
                                    <label className="font-body text-muted-foreground mb-1.5 block text-xs tracking-wider uppercase">
                                        Occasion<span className="text-destructive ml-0.5">*</span>
                                    </label>
                                    <Input
                                        required
                                        value={data.occasion}
                                        onChange={(event) => setData('occasion', event.target.value)}
                                        placeholder="Birthday, anniversary, corporate event..."
                                        className="font-body h-10 text-sm"
                                    />
                                    {errors.occasion && <p className="text-destructive mt-1 text-sm">{errors.occasion}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="font-body text-muted-foreground mb-1.5 block text-xs tracking-wider uppercase">Notes</label>
                                <Textarea
                                    value={data.notes}
                                    onChange={(event) => setData('notes', event.target.value)}
                                    rows={4}
                                    placeholder="Dietary requirements, seating preferences..."
                                    className="font-body text-sm"
                                />
                            </div>

                            <Recaptcha
                                ref={recaptchaRef}
                                onChange={(token) => setData('recaptcha', token)}
                                error={errors.recaptcha}
                                className="mt-2"
                            />
                            <Button
                                type="submit"
                                disabled={processing}
                                className="font-body h-12 w-full text-sm tracking-wide uppercase sm:w-auto sm:px-10"
                            >
                                {processing ? 'Submitting...' : 'Submit Booking'}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
