import InlineSearch from '@/components/layout/inline-search';
import { useCart } from '@/lib/cart-store';
import type { SharedData } from '@/types/ratalfoods';
import { Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, LogIn, LogOut, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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
    const { brand_name: brandName, logo } = props.footerContent;

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
        <header className="border-border fixed top-0 right-0 left-0 z-50 border-b bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="relative flex h-16 items-center justify-between sm:h-20">
                    <Link href="/" className="flex items-center gap-2">
                        {logo ? (
                            <img src={logo} alt={brandName} className="h-12 w-auto max-w-[220px] object-contain sm:h-16" />
                        ) : (
                            <span className="font-heading text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">{brandName}</span>
                        )}
                    </Link>

                    <nav className="hidden items-center gap-8 md:flex">
                        {nav.map((item) => (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`font-body hover:text-primary text-sm tracking-wide uppercase transition-colors duration-300 ${
                                    pathname === item.path ? 'text-primary' : 'text-foreground/70'
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
                            className="text-foreground/70 hover:text-primary p-2 transition-colors"
                            aria-label="Search"
                        >
                            <Search className="h-5 w-5" />
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsOpen(true)}
                            className="text-foreground hover:text-primary relative p-2 transition-all duration-300 hover:scale-105"
                        >
                            <ShoppingBag className="h-5 w-5" />
                            {itemCount > 0 && (
                                <span className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold">
                                    {itemCount}
                                </span>
                            )}
                        </button>

                        <div className="relative" ref={userMenuRef}>
                            <button
                                type="button"
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="text-foreground/70 hover:text-primary p-2 transition-colors"
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
                                        className="border-border bg-card absolute top-full right-0 z-50 mt-2 w-52 overflow-hidden rounded-md border shadow-lg"
                                    >
                                        {user && (
                                            <div className="border-border border-b px-4 py-3">
                                                <p className="font-body truncate text-xs font-medium">{user.name}</p>
                                                <p className="font-body text-muted-foreground truncate text-xs">{user.email}</p>
                                            </div>
                                        )}
                                        <div className="py-1">
                                            {user ? (
                                                <>
                                                    <Link
                                                        href={dashboardHref}
                                                        onClick={() => setUserMenuOpen(false)}
                                                        className="font-body hover:bg-muted flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                                                    >
                                                        <LayoutDashboard className="text-muted-foreground h-4 w-4" />
                                                        Dashboard
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={signOut}
                                                        className="font-body hover:bg-muted flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors"
                                                    >
                                                        <LogOut className="text-muted-foreground h-4 w-4" />
                                                        Sign Out
                                                    </button>
                                                </>
                                            ) : (
                                                <Link
                                                    href="/login"
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className="font-body hover:bg-muted flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                                                >
                                                    <LogIn className="text-muted-foreground h-4 w-4" />
                                                    Sign In
                                                </Link>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button type="button" onClick={() => setMobileOpen(!mobileOpen)} className="text-foreground p-2 md:hidden">
                            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>

                    <InlineSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
                </div>
            </div>

            {!storeOpen && (
                <div className="border-border bg-muted font-body text-muted-foreground border-t px-4 py-2 text-center text-xs">
                    We&apos;re currently closed — orders and bookings will be reviewed when we reopen.
                </div>
            )}

            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-border bg-background overflow-hidden border-t md:hidden"
                    >
                        <nav className="flex flex-col gap-1 px-6 py-4">
                            {nav.map((item) => (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`font-body py-3 text-sm tracking-wide uppercase ${
                                        pathname === item.path ? 'text-primary' : 'text-foreground/70'
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
