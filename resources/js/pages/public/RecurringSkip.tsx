import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { CalendarX, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

type SkipProps = {
    date: string;
    date_label: string;
    already_skipped: boolean;
    order_number: string | null;
    started: boolean;
};

export default function RecurringSkip({ date_label, already_skipped, order_number, started }: SkipProps) {
    const [busy, setBusy] = useState(false);

    // The signed address of this page is also the address that accepts the confirmation.
    const confirmSkip = () => {
        router.post(window.location.href, {}, { preserveScroll: true, onStart: () => setBusy(true), onFinish: () => setBusy(false) });
    };

    return (
        <AppLayout>
            <Head title="Skip this order" />

            <section className="bg-background flex min-h-[70vh] items-center justify-center px-4 pt-28 pb-16">
                <div className="border-border w-full max-w-md rounded-xl border bg-white p-8 text-center shadow-sm">
                    {already_skipped ? (
                        <>
                            <CheckCircle2 className="text-accent mx-auto mb-4 h-10 w-10" />
                            <h1 className="font-heading text-2xl">Order skipped</h1>
                            <p className="font-body text-muted-foreground mt-3 text-sm">
                                Your order for {date_label} is skipped. Your repeat schedule carries on as normal after that.
                            </p>
                        </>
                    ) : started ? (
                        <>
                            <CalendarX className="text-muted-foreground mx-auto mb-4 h-10 w-10" />
                            <h1 className="font-heading text-2xl">Too late to skip</h1>
                            <p className="font-body text-muted-foreground mt-3 text-sm">
                                The kitchen has already started on your order for {date_label}
                                {order_number ? ` (${order_number})` : ''}. Please call us if you need help.
                            </p>
                        </>
                    ) : (
                        <>
                            <CalendarX className="text-primary mx-auto mb-4 h-10 w-10" />
                            <h1 className="font-heading text-2xl">Skip this order?</h1>
                            <p className="font-body text-muted-foreground mt-3 text-sm">
                                Your order for {date_label} will be cancelled. Your repeat schedule carries on after that.
                            </p>
                            <Button className="mt-6 w-full" disabled={busy} onClick={confirmSkip}>
                                {busy ? 'Skipping…' : 'Yes, skip it'}
                            </Button>
                        </>
                    )}

                    <Button asChild variant="outline" className="mt-3 w-full">
                        <Link href="/">Back to Ratal Foods</Link>
                    </Button>
                </div>
            </section>
        </AppLayout>
    );
}
