import type { FooterLink, SharedData } from '@/types/ratalfoods';
import { Link, usePage } from '@inertiajs/react';

function isExternal(href: string): boolean {
    return href.startsWith('http://') || href.startsWith('https://');
}

function FooterNavLink({ link, className }: { link: FooterLink; className: string }) {
    if (isExternal(link.href)) {
        return (
            <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
                {link.label}
            </a>
        );
    }

    return (
        <Link href={link.href} className={className}>
            {link.label}
        </Link>
    );
}

export default function Footer() {
    const { footerContent } = usePage<SharedData>().props;
    const copyright = footerContent.copyright.replace('{year}', String(new Date().getFullYear()));
    const linkClass = 'font-body text-sm text-background/80 transition-colors hover:text-primary';
    const navClass = 'font-body text-xs text-background/50 transition-colors hover:text-background/80';

    return (
        <footer className="bg-foreground text-background/80">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
                <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
                    <div>
                        {footerContent.logo ? (
                            <img
                                src={footerContent.logo}
                                alt={footerContent.brand_name}
                                className="mb-4 h-16 w-auto max-w-[240px] object-contain sm:h-20"
                            />
                        ) : (
                            <h3 className="font-heading text-background mb-4 text-2xl">{footerContent.brand_name}</h3>
                        )}
                        <p className="font-body text-background/80 max-w-xs text-sm leading-relaxed">{footerContent.tagline}</p>
                        <p className="font-body text-background/80 mt-4 text-sm">{footerContent.phone}</p>
                    </div>

                    <div>
                        <h4 className="font-body text-background mb-4 text-xs font-bold tracking-widest uppercase">
                            {footerContent.taste_map_heading}
                        </h4>
                        <nav className="flex flex-col gap-2">
                            {footerContent.taste_map.map((link) => (
                                <FooterNavLink key={`${link.label}-${link.href}`} link={link} className={linkClass} />
                            ))}
                        </nav>
                    </div>

                    <div>
                        <h4 className="font-body text-background mb-4 text-xs font-bold tracking-widest uppercase">
                            {footerContent.community_heading}
                        </h4>
                        <nav className="flex flex-col gap-2">
                            {footerContent.community.map((link) => (
                                <FooterNavLink key={`${link.label}-${link.href}`} link={link} className={linkClass} />
                            ))}
                        </nav>
                    </div>
                </div>

                <div className="border-background/10 mt-16 border-t pt-8">
                    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                        <p className="font-body text-background/50 text-xs">{copyright}</p>
                        <div className="flex gap-6">
                            {footerContent.nav.map((link) => (
                                <FooterNavLink key={`${link.label}-${link.href}`} link={link} className={navClass} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
