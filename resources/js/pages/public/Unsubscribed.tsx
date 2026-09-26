import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { MailCheck } from 'lucide-react';

export default function Unsubscribed({ email }: { email: string }) {
    return (
        <AppLayout>
            <Head title="Unsubscribed" />

            <section className="bg-background flex min-h-[70vh] items-center justify-center px-4 pt-28 pb-16">
                <div className="border-border w-full max-w-md rounded-xl border bg-white p-8 text-center shadow-sm">
                    <MailCheck className="text-primary mx-auto mb-4 h-10 w-10" />
                    <h1 className="font-heading text-2xl">You are unsubscribed</h1>
                    <p className="font-body text-muted-foreground mt-3 text-sm">
                        We will not send offers to <span className="text-foreground">{email}</span> any more. You will still get emails about your own
                        orders and bookings.
                    </p>
                    <Button asChild className="mt-6">
                        <Link href="/">Back to Ratal Foods</Link>
                    </Button>
                </div>
            </section>
        </AppLayout>
    );
}
