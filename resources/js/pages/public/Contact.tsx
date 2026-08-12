import { Head, useForm, usePage } from '@inertiajs/react';
import { Loader2, Mail, MapPin, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { FormEvent } from 'react';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { ContactPageContent, SharedData } from '@/types/ratalfoods';

function WhatsAppIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={className}
            fill="currentColor"
        >
            <path d="M19.05 4.91A9.82 9.82 0 0 0 12.09 2a9.9 9.9 0 0 0-8.58 14.84L2 22l5.33-1.4a9.89 9.89 0 0 0 4.75 1.22h.01A9.9 9.9 0 0 0 22 11.92a9.78 9.78 0 0 0-2.95-7.01Zm-6.96 15.24h-.01a8.22 8.22 0 0 1-4.19-1.15l-.3-.18-3.16.83.84-3.08-.2-.32a8.23 8.23 0 1 1 7.02 3.9Zm4.52-6.17c-.25-.13-1.47-.73-1.7-.81-.23-.09-.39-.13-.56.12-.17.25-.64.81-.79.98-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.24-.74-.66-1.24-1.47-1.39-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.76-1.85-.2-.48-.4-.42-.56-.42h-.47c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.75.59.26 1.06.42 1.42.54.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.68-1.19.21-.58.21-1.08.15-1.18-.06-.11-.23-.17-.48-.29Z" />
        </svg>
    );
}

export default function Contact({ pageContent }: { pageContent: ContactPageContent }) {
    const { flash } = usePage<SharedData>().props;
    const mapAddress = pageContent.location;
    const whatsappUrl = pageContent.whatsapp_url;

    const { data, setData, post, processing, errors, reset } = useForm({
        type: 'general' as const,
        name: '',
        email: '',
        phone: '',
        message: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        post(
            '/contact',
            {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    setData('type', 'general');
                },
            },
        );
    };

    return (
        <AppLayout>
            <Head title="Contact" />

            <div>
                <section className="relative h-64 overflow-hidden pt-20 sm:h-80 sm:pt-24">
                    <img
                        src={pageContent.hero.image}
                        alt="Nigerian food spread"
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-foreground/60" />
                    <div className="relative z-10 flex h-full items-center justify-center px-4 text-center">
                        <div>
                            <p className="mb-3 font-body text-xs uppercase tracking-[0.3em] text-background/70">
                                {pageContent.hero.eyebrow}
                            </p>
                            <h1 className="font-heading text-4xl tracking-tight text-background sm:text-5xl">
                                {pageContent.hero.title}
                            </h1>
                        </div>
                    </div>
                </section>

                <div className="mx-auto max-w-7xl px-4 py-8 pb-20 sm:px-6 lg:px-8">
                    <PageBreadcrumb
                        items={[
                            { title: 'Home', href: '/' },
                            { title: 'Contact' },
                        ]}
                    />

                    <div className="mt-6 grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <p className="mb-4 font-body text-xs uppercase tracking-[0.3em] text-muted-foreground">
                                {pageContent.intro.eyebrow}
                            </p>
                            <h1 className="font-heading text-4xl tracking-tight sm:text-5xl">
                                {pageContent.intro.heading}
                            </h1>
                            <p className="mt-4 max-w-md font-body text-base leading-relaxed text-muted-foreground">
                                {pageContent.intro.body}
                            </p>

                            <div className="mt-12 space-y-6">
                                {[
                                    { icon: MapPin, label: pageContent.location_label, value: pageContent.location },
                                    { icon: Phone, label: pageContent.phone_label, value: pageContent.phone },
                                    { icon: Mail, label: pageContent.email_label, value: pageContent.email },
                                ].map((info) => (
                                    <div key={info.label} className="flex items-start gap-4">
                                        <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                                            <info.icon className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">
                                                {info.label}
                                            </p>
                                            <p className="mt-0.5 font-body text-sm">{info.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Button
                                asChild
                                className="mt-8 h-12 rounded-sm bg-[#355466] px-6 font-body text-base font-semibold text-white hover:bg-[#2f4959]"
                            >
                                <a href={whatsappUrl} target="_blank" rel="noreferrer">
                                    <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
                                    {pageContent.whatsapp_label}
                                </a>
                            </Button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            {flash.success && (
                                <div className="mb-6 rounded-md border border-accent/30 bg-accent/10 px-4 py-3 font-body text-sm text-accent">
                                    {flash.success}
                                </div>
                            )}

                            <form onSubmit={submit} className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block font-body text-xs uppercase tracking-wider text-muted-foreground">
                                            Name
                                        </label>
                                        <Input
                                            required
                                            value={data.name}
                                            onChange={(event) => setData('name', event.target.value)}
                                            className="h-10 font-body text-sm"
                                        />
                                        {errors.name && (
                                            <p className="mt-1 text-sm text-destructive">{errors.name}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block font-body text-xs uppercase tracking-wider text-muted-foreground">
                                            Email
                                        </label>
                                        <Input
                                            required
                                            type="email"
                                            value={data.email}
                                            onChange={(event) => setData('email', event.target.value)}
                                            className="h-10 font-body text-sm"
                                        />
                                        {errors.email && (
                                            <p className="mt-1 text-sm text-destructive">{errors.email}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1.5 block font-body text-xs uppercase tracking-wider text-muted-foreground">
                                        Phone
                                    </label>
                                    <Input
                                        value={data.phone}
                                        onChange={(event) => setData('phone', event.target.value)}
                                        className="h-10 font-body text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block font-body text-xs uppercase tracking-wider text-muted-foreground">
                                        Message
                                    </label>
                                    <Textarea
                                        required
                                        value={data.message}
                                        onChange={(event) => setData('message', event.target.value)}
                                        rows={4}
                                        className="font-body text-sm"
                                    />
                                    {errors.message && (
                                        <p className="mt-1 text-sm text-destructive">{errors.message}</p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    className="h-12 w-full font-body text-sm tracking-wide uppercase"
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        'Send Message'
                                    )}
                                </Button>
                            </form>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="mt-14"
                    >
                        <h2 className="font-heading text-2xl tracking-tight sm:text-3xl">
                            {pageContent.map_heading}
                        </h2>
                        <p className="mt-2 font-body text-sm text-muted-foreground">
                            Visit us at {mapAddress}
                        </p>
                        <div className="mt-5 overflow-hidden rounded-md border border-border shadow-sm">
                            <iframe
                                title="Ratal Foods location map"
                                src={`https://www.google.com/maps?q=${encodeURIComponent(mapAddress)}&output=embed`}
                                className="h-[360px] w-full"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>
                    </motion.div>
                </div>
            </div>
        </AppLayout>
    );
}
