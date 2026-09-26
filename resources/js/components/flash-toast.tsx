import { NOTICE_EVENT, type NoticeType } from '@/lib/notify';
import type { SharedData } from '@/types/ratalfoods';
import { usePage } from '@inertiajs/react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

type Notice = { type: 'success' | 'error'; message: string };

/**
 * Reads flash.success / flash.error from the current Inertia response and
 * shows it as a dismissible toast. Backend redirects (including the
 * friendly-500 handler in bootstrap/app.php) set these session values.
 */
export default function FlashToast({ errorsOnly = false }: { errorsOnly?: boolean }) {
    const { flash } = usePage<SharedData>().props;
    const [notice, setNotice] = useState<Notice | null>(null);

    // Toasts raised from code (network failures, unusable responses, background calls).
    useEffect(() => {
        let timer: number | undefined;

        const onNotice = (event: Event) => {
            const { message, type } = (event as CustomEvent<{ message: string; type: NoticeType }>).detail;
            setNotice({ type, message });
            window.clearTimeout(timer);
            timer = window.setTimeout(() => setNotice(null), type === 'error' ? 6000 : 4000);
        };

        window.addEventListener(NOTICE_EVENT, onNotice);

        return () => {
            window.removeEventListener(NOTICE_EVENT, onNotice);
            window.clearTimeout(timer);
        };
    }, []);

    useEffect(() => {
        if (flash.error) {
            setNotice({ type: 'error', message: flash.error });
        } else if (flash.success && !errorsOnly) {
            setNotice({ type: 'success', message: flash.success });
        } else {
            return;
        }

        const timer = window.setTimeout(() => setNotice(null), flash.error ? 6000 : 4000);

        return () => window.clearTimeout(timer);
    }, [flash.success, flash.error]);

    if (!notice) {
        return null;
    }

    const isError = notice.type === 'error';

    return (
        <div
            role="status"
            aria-live="polite"
            className={`font-body fixed top-4 right-4 z-50 flex max-w-sm items-start gap-2.5 rounded-lg border px-4 py-3 text-sm shadow-lg ${
                isError ? 'border-destructive/30 bg-destructive text-destructive-foreground' : 'border-accent/30 bg-accent text-accent-foreground'
            }`}
        >
            {isError ? <XCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>{notice.message}</span>
            <button type="button" onClick={() => setNotice(null)} className="ml-1 opacity-70 hover:opacity-100" aria-label="Dismiss">
                ×
            </button>
        </div>
    );
}
