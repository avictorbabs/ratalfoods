import Recaptcha from '@/components/recaptcha';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { SharedData } from '@/types/ratalfoods';
import { useForm, usePage } from '@inertiajs/react';
import { Gift, MailCheck } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import type ReCAPTCHA from 'react-google-recaptcha';

const DISMISSED_KEY = 'ratalfoods_welcome_dismissed';
const SUBSCRIBED_KEY = 'ratalfoods_welcome_subscribed';
const DISMISS_DAYS = 30;

// Pages where a popup would get in the way of the visitor.
const HIDDEN_PREFIXES = ['/checkout', '/login', '/register', '/forgot-password', '/reset-password', '/admin', '/dashboard', '/settings'];

function readStorage(key: string): string | null {
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

function writeStorage(key: string, value: string): void {
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // Storage can be blocked; the popup then simply shows again next visit.
    }
}

function recentlyDismissed(): boolean {
    if (readStorage(SUBSCRIBED_KEY)) {
        return true;
    }

    const stamp = Number(readStorage(DISMISSED_KEY));

    return stamp > 0 && Date.now() - stamp < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

export default function WelcomeOfferModal() {
    const { welcomeOffer } = usePage<SharedData>().props;
    const { url } = usePage();
    const [open, setOpen] = useState(false);
    const [done, setDone] = useState(false);
    const recaptchaRef = useRef<ReCAPTCHA>(null);

    const { data, setData, post, processing, errors, reset } = useForm({ name: '', email: '', recaptcha: '' });

    const hiddenHere = HIDDEN_PREFIXES.some((prefix) => url.startsWith(prefix));

    useEffect(() => {
        if (!welcomeOffer || hiddenHere || recentlyDismissed()) {
            return;
        }

        const timer = window.setTimeout(() => setOpen(true), welcomeOffer.delay_seconds * 1000);

        return () => window.clearTimeout(timer);
    }, [welcomeOffer, hiddenHere]);

    if (!welcomeOffer) {
        return null;
    }

    const close = (next: boolean) => {
        setOpen(next);

        if (!next) {
            writeStorage(DISMISSED_KEY, String(Date.now()));
        }
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();

        post('/newsletter', {
            preserveScroll: true,
            onSuccess: () => {
                writeStorage(SUBSCRIBED_KEY, '1');
                setDone(true);
                reset();
            },
            onFinish: () => {
                recaptchaRef.current?.reset();
                setData('recaptcha', '');
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent className="sm:max-w-md">
                {done ? (
                    <div className="py-4 text-center">
                        <MailCheck className="text-primary mx-auto mb-3 h-10 w-10" />
                        <DialogTitle className="font-heading text-2xl">Check your inbox</DialogTitle>
                        <DialogDescription className="mt-2">
                            Your welcome code is on its way. Use it at checkout on your first order.
                        </DialogDescription>
                        <Button className="mt-6" onClick={() => close(false)}>
                            Start browsing
                        </Button>
                    </div>
                ) : (
                    <>
                        <DialogHeader className="text-center sm:text-center">
                            <Gift className="text-primary mx-auto mb-1 h-8 w-8" />
                            <DialogTitle className="font-heading text-2xl">{welcomeOffer.headline}</DialogTitle>
                            <DialogDescription>
                                {welcomeOffer.body ?? 'Join our mailing list and we will email you a personal code for your first order.'}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={submit} className="space-y-3">
                            <div>
                                <Input
                                    required
                                    value={data.name}
                                    onChange={(event) => setData('name', event.target.value)}
                                    placeholder="Your name"
                                    className="font-body h-11 text-sm"
                                />
                                {errors.name && <p className="text-destructive mt-1 text-sm">{errors.name}</p>}
                            </div>
                            <div>
                                <Input
                                    required
                                    type="email"
                                    value={data.email}
                                    onChange={(event) => setData('email', event.target.value)}
                                    placeholder="you@example.com"
                                    className="font-body h-11 text-sm"
                                />
                                {errors.email && <p className="text-destructive mt-1 text-sm">{errors.email}</p>}
                            </div>
                            <Recaptcha ref={recaptchaRef} onChange={(token) => setData('recaptcha', token)} error={errors.recaptcha} />
                            <Button type="submit" disabled={processing} className="font-body h-11 w-full text-sm tracking-wide uppercase">
                                {processing ? 'Sending…' : 'Send me my code'}
                            </Button>
                            <button
                                type="button"
                                onClick={() => close(false)}
                                className="text-muted-foreground hover:text-foreground font-body w-full text-center text-xs"
                            >
                                No thanks
                            </button>
                        </form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
