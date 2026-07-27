import { Link, router, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    LogIn,
    LogOut,
    Menu,
    Search,
    ShoppingBag,
    User,
    X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import InlineSearch from '@/components/layout/inline-search';
import { useCart } from '@/lib/cart-store';
import type { SharedData } from '@/types/ratalfoods';

const nav = [
    { label: 'Home', path: '/' },
    { label: 'Menu', path: '/menu' },
    { label: 'Bookings', path: '/bookings' },
    { label: 'About', path: '/about' },
    { label: 'Gallery', path: '/gallery' },
    { label: 'Blog', path: '/blog' },
    { label: 'Contact', path: '/contact' },
];

export default function Header() {
    const { itemCount, setIsOpen } = useCart();
    const { url, props } = usePage<SharedData>();
    const user = props.auth.user;
    const storeOpen = props.storeSettings.is_open;

    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    useEffect(() => {
        setMobileOpen(false);
    }, [url]);

    const pathname = new URL(url, window.location.origin).pathname;

    const signOut = () => {
        setUserMenuOpen(false);
        router.post('/logout');
    };

    const dashboardHref = user?.role === 'admin' ? '/admin' : '/dashboard';

    return (
        <header className="fixed top-0 right-0 left-0 z-50 border-b border-border bg-background">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="relative flex h-16 items-center justify-between sm:h-20">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                            Ratal Foods
                        </span>
                    </Link>

                    <nav className="hidden items-center gap-8 md:flex">
                        {nav.map((item) => (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`font-body text-sm tracking-wide uppercase transition-colors duration-300 hover:text-primary ${
                                    pathname === item.path
                                        ? 'text-primary'
                                        : 'text-foreground/70'
                                }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={() => setSearchOpen(true)}
                            className="p-2 text-foreground/70 transition-colors hover:text-primary"
                            aria-label="Search"
                        >
                            <Search className="h-5 w-5" />
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsOpen(true)}
                            className="relative p-2 text-foreground transition-all duration-300 hover:scale-105 hover:text-primary"
                        >
                            <ShoppingBag className="h-5 w-5" />
                            {itemCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                                    {itemCount}
                                </span>
                            )}
                        </button>

                        <div className="relative" ref={userMenuRef}>
                            <button
                                type="button"
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="p-2 text-foreground/70 transition-colors hover:text-primary"
                                aria-label="Account"
                            >
                                <User className="h-5 w-5" />
                            </button>
                            <AnimatePresence>
                                {userMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-md border border-border bg-card shadow-lg"
                                    >
                                        {user && (
                                            <div className="border-b border-border px-4 py-3">
                                                <p className="truncate font-body text-xs font-medium">
                                                    {user.name}
                                                </p>
                                                <p className="truncate font-body text-xs text-muted-foreground">
                                                    {user.email}
                                                </p>
                                            </div>
                                        )}
                                        <div className="py-1">
                                            {user ? (
                                                <>
                                                    <Link
                                                        href={dashboardHref}
                                                        onClick={() => setUserMenuOpen(false)}
                                                        className="flex items-center gap-2.5 px-4 py-2.5 font-body text-sm transition-colors hover:bg-muted"
                                                    >
                                                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                                                        Dashboard
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={signOut}
                                                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left font-body text-sm transition-colors hover:bg-muted"
                                                    >
                                                        <LogOut className="h-4 w-4 text-muted-foreground" />
                                                        Sign Out
                                                    </button>
                                                </>
                                            ) : (
                                                <Link
                                                    href="/login"
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className="flex items-center gap-2.5 px-4 py-2.5 font-body text-sm transition-colors hover:bg-muted"
                                                >
                                                    <LogIn className="h-4 w-4 text-muted-foreground" />
                                                    Sign In
                                                </Link>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button
                            type="button"
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="p-2 text-foreground md:hidden"
                        >
                            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>

                    <InlineSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
                </div>
            </div>

            {!storeOpen && (
                <div className="border-t border-border bg-muted px-4 py-2 text-center font-body text-xs text-muted-foreground">
                    We&apos;re currently closed — orders and bookings will be reviewed when we reopen.
                </div>
            )}

            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden border-t border-border bg-background md:hidden"
                    >
                        <nav className="flex flex-col gap-1 px-6 py-4">
                            {nav.map((item) => (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`py-3 font-body text-sm tracking-wide uppercase ${
                                        pathname === item.path
                                            ? 'text-primary'
                                            : 'text-foreground/70'
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
