import FlashToast from '@/components/flash-toast';
import CartDrawer from '@/components/layout/cart-drawer';
import Footer from '@/components/layout/footer';
import Header from '@/components/layout/header';
import WelcomeOfferModal from '@/components/layout/welcome-offer-modal';
import type { SharedData } from '@/types/ratalfoods';
import { usePage } from '@inertiajs/react';
import { PropsWithChildren, useEffect, useState } from 'react';

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
        <div className="bg-background font-body flex min-h-screen flex-col">
            <Header />
            {visibleFlash && (
                <div className="border-accent/20 bg-accent font-body text-accent-foreground fixed top-16 right-0 left-0 z-40 border-b px-4 py-2.5 text-center text-sm sm:top-20">
                    {visibleFlash}
                </div>
            )}
            <main className="flex-1">{children}</main>
            <Footer />
            <CartDrawer />
            <FlashToast errorsOnly />
            <WelcomeOfferModal />
        </div>
    );
}
