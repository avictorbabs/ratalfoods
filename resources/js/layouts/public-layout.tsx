import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
import type { SharedData } from '@/types/ratalfoods';

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/menu', label: 'Menu' },
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact Us' },
    { href: '/bookings', label: 'Bookings' },
];

export default function PublicLayout({ children }: PropsWithChildren) {
    const { auth, storeSettings, flash } = usePage<SharedData>().props;

    return (
        <div className="min-h-screen bg-background text-foreground font-body">
            <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                    <Link href="/" className="font-heading text-2xl tracking-tight">
                        {storeSettings.store_name}
                    </Link>

                    <nav className="hidden items-center gap-6 md:flex">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-sm uppercase tracking-wide text-muted-foreground transition hover:text-foreground"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/checkout"
                            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                        >
                            Cart
                        </Link>
                        {auth.user ? (
                            <>
                                <Link href="/dashboard" className="text-sm hover:underline">
                                    Account
                                </Link>
                                {auth.user.role === 'admin' && (
                                    <Link href="/admin" className="text-sm hover:underline">
                                        Admin
                                    </Link>
                                )}
                            </>
                        ) : (
                            <Link href="/login" className="text-sm hover:underline">
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <main>
                {flash.success && (
                    <div className="bg-accent px-4 py-3 text-center text-sm text-accent-foreground">
                        {flash.success}
                    </div>
                )}
                {children}
            </main>

            <footer className="border-t border-border bg-card">
                <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                    <div className="grid gap-6 md:grid-cols-3">
                        <div>
                            <p className="font-heading text-xl">{storeSettings.store_name}</p>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Authentic Nigerian cuisine in Windsor, ON.
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Contact</p>
                            <p className="mt-2 text-sm text-muted-foreground">{storeSettings.phone}</p>
                            <p className="text-sm text-muted-foreground">{storeSettings.email}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Hours</p>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {storeSettings.opening_hours}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {storeSettings.is_open ? 'Open now' : 'Currently closed'}
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
