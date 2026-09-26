import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { History, RotateCcw, UserPlus } from 'lucide-react';

/**
 * Shown to guests after an order or booking, inviting them to create an account
 * (or to log in if that email already has one).
 */
export default function GuestSignupCard({ hasAccount, kind }: { hasAccount: boolean; kind: 'order' | 'booking' }) {
    return (
        <div className="border-border bg-background mt-6 rounded-lg border p-5 text-left">
            {hasAccount ? (
                <>
                    <p className="font-heading text-lg">You already have an account</p>
                    <p className="font-body text-muted-foreground mt-1 text-sm">Log in to see this {kind} in your dashboard.</p>
                    <Button asChild className="mt-4 w-full">
                        <Link href="/login">Log in</Link>
                    </Button>
                </>
            ) : (
                <>
                    <p className="font-heading text-lg">Save your details for next time</p>
                    <ul className="font-body text-muted-foreground mt-2 space-y-1.5 text-sm">
                        <li className="flex items-center gap-2">
                            <History className="text-primary h-4 w-4 shrink-0" />
                            Track this {kind} and see your full history
                        </li>
                        <li className="flex items-center gap-2">
                            <RotateCcw className="text-primary h-4 w-4 shrink-0" />
                            Order your favourites again in one click
                        </li>
                        <li className="flex items-center gap-2">
                            <UserPlus className="text-primary h-4 w-4 shrink-0" />
                            Your name and email are already filled in
                        </li>
                    </ul>
                    <Button asChild className="mt-4 w-full">
                        <Link href="/register">Create my account</Link>
                    </Button>
                </>
            )}
        </div>
    );
}
