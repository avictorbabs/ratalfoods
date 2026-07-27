import { usePage } from '@inertiajs/react';
import { PropsWithChildren, useEffect, useState } from 'react';
import CartDrawer from '@/components/layout/cart-drawer';
import Footer from '@/components/layout/footer';
import Header from '@/components/layout/header';
import type { SharedData } from '@/types/ratalfoods';

export default function AppLayout({ children }: PropsWithChildren) {
    const { flash } = usePage<SharedData>().props;
    const [visibleFlash, setVisibleFlash] = useState<string | null>(null);

    useEffect(() => {
        if (!flash.success) {
            setVisibleFlash(null);
            return;
        }

        setVisibleFlash(flash.success);

        const timer = window.setTimeout(() => {
            setVisibleFlash(null);
        }, 4000);

        return () => window.clearTimeout(timer);
    }, [flash.success]);

    return (
        <div className="flex min-h-screen flex-col bg-background font-body">
            <Header />
            {visibleFlash && (
                <div className="fixed top-16 right-0 left-0 z-40 border-b border-accent/20 bg-accent px-4 py-2.5 text-center font-body text-sm text-accent-foreground sm:top-20">
                    {visibleFlash}
                </div>
            )}
            <main className="flex-1">{children}</main>
            <Footer />
            <CartDrawer />
        </div>
    );
}
