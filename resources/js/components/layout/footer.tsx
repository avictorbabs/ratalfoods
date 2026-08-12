import { Link, usePage } from '@inertiajs/react';
import type { FooterLink, SharedData } from '@/types/ratalfoods';

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
    const linkClass = 'font-body text-sm text-background/60 transition-colors hover:text-primary';
    const navClass = 'font-body text-xs text-background/30 transition-colors hover:text-background/60';

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
                            <h3 className="mb-4 font-heading text-2xl text-background">
                                {footerContent.brand_name}
                            </h3>
                        )}
                        <p className="max-w-xs font-body text-sm leading-relaxed text-background/60">
                            {footerContent.tagline}
                        </p>
                        <p className="mt-4 font-body text-sm text-background/60">{footerContent.phone}</p>
                    </div>

                    <div>
                        <h4 className="mb-4 font-body text-xs uppercase tracking-widest text-background/40">
                            {footerContent.taste_map_heading}
                        </h4>
                        <nav className="flex flex-col gap-2">
                            {footerContent.taste_map.map((link) => (
                                <FooterNavLink key={`${link.label}-${link.href}`} link={link} className={linkClass} />
                            ))}
                        </nav>
                    </div>

                    <div>
                        <h4 className="mb-4 font-body text-xs uppercase tracking-widest text-background/40">
                            {footerContent.community_heading}
                        </h4>
                        <nav className="flex flex-col gap-2">
                            {footerContent.community.map((link) => (
                                <FooterNavLink key={`${link.label}-${link.href}`} link={link} className={linkClass} />
                            ))}
                        </nav>
                    </div>
                </div>

                <div className="mt-16 border-t border-background/10 pt-8">
                    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                        <p className="font-body text-xs text-background/30">{copyright}</p>
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
