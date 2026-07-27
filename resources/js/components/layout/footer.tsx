import { Link } from '@inertiajs/react';

const categories = [
    'Nigerian Classics',
    'All-Time Favourites',
    'Grilled & Spicy',
    'Seasonal Specials',
    'Sides & Extras',
];

const socials = [
    { label: 'Facebook', url: 'https://www.facebook.com/215263468329993' },
    { label: 'Instagram', url: 'https://www.instagram.com/ratalfoods' },
    { label: 'TikTok', url: 'https://www.tiktok.com/@ratal.foods' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/augustina-kadiri-omogbai' },
    { label: 'Yelp', url: 'https://www.yelp.com/biz/GN4j-qGUouoNFm_K6ZmKgA' },
];

export default function Footer() {
    return (
        <footer className="bg-foreground text-background/80">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
                <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
                    <div>
                        <h3 className="mb-4 font-heading text-2xl text-background">Ratal Foods</h3>
                        <p className="max-w-xs font-body text-sm leading-relaxed text-background/60">
                            Authentic Nigerian cuisine in Windsor, ON. Crafted with heritage, served
                            with pride.
                        </p>
                        <p className="mt-4 font-body text-sm text-background/60">226-348-7156</p>
                    </div>

                    <div>
                        <h4 className="mb-4 font-body text-xs uppercase tracking-widest text-background/40">
                            Taste Map
                        </h4>
                        <nav className="flex flex-col gap-2">
                            {categories.map((category) => (
                                <Link
                                    key={category}
                                    href={`/menu?category=${encodeURIComponent(category)}`}
                                    className="font-body text-sm text-background/60 transition-colors hover:text-primary"
                                >
                                    {category}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    <div>
                        <h4 className="mb-4 font-body text-xs uppercase tracking-widest text-background/40">
                            Community Ledger
                        </h4>
                        <nav className="flex flex-col gap-2">
                            {socials.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-body text-sm text-background/60 transition-colors hover:text-primary"
                                >
                                    {social.label}
                                </a>
                            ))}
                        </nav>
                    </div>
                </div>

                <div className="mt-16 border-t border-background/10 pt-8">
                    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                        <p className="font-body text-xs text-background/30">
                            © {new Date().getFullYear()} Ratal Foods. All Rights Reserved.
                        </p>
                        <div className="flex gap-6">
                            <Link
                                href="/"
                                className="font-body text-xs text-background/30 transition-colors hover:text-background/60"
                            >
                                Home
                            </Link>
                            <Link
                                href="/menu"
                                className="font-body text-xs text-background/30 transition-colors hover:text-background/60"
                            >
                                Menu
                            </Link>
                            <Link
                                href="/about"
                                className="font-body text-xs text-background/30 transition-colors hover:text-background/60"
                            >
                                About
                            </Link>
                            <Link
                                href="/contact"
                                className="font-body text-xs text-background/30 transition-colors hover:text-background/60"
                            >
                                Contact
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
