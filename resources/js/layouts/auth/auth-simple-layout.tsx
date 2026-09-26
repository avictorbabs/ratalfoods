import FlashToast from '@/components/flash-toast';
import type { SharedData } from '@/types/ratalfoods';
import { Link, usePage } from '@inertiajs/react';

interface AuthLayoutProps {
    children: React.ReactNode;
    name?: string;
    title?: string;
    description?: string;
    wide?: boolean;
}

function BrandLogo({ className }: { className: string }) {
    const { footerContent } = usePage<SharedData>().props;

    return footerContent.logo ? (
        <img src={footerContent.logo} alt={footerContent.brand_name} className={className} />
    ) : (
        <span className="font-heading text-2xl">{footerContent.brand_name}</span>
    );
}

export default function AuthSimpleLayout({ children, title, description, wide }: AuthLayoutProps) {
    const { footerContent } = usePage<SharedData>().props;

    return (
        <div className="bg-background grid min-h-svh lg:grid-cols-2">
            <FlashToast />
            <div className="bg-foreground relative hidden overflow-hidden lg:block">
                <img
                    src="/images/why-choose-us/authentic-cuisine.webp"
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover opacity-60"
                />
                <div className="from-foreground via-foreground/40 absolute inset-0 bg-gradient-to-t to-transparent" />

                <div className="relative z-10 flex h-full flex-col justify-between p-12">
                    <Link href="/" className="w-fit rounded-md bg-white px-4 py-3 shadow-lg">
                        <BrandLogo className="h-12 w-auto max-w-[200px] object-contain" />
                    </Link>

                    <div className="max-w-md">
                        <div className="bg-primary mb-6 h-1 w-14 rounded-full" />
                        <h2 className="font-heading text-background text-4xl leading-tight tracking-tight">
                            Your table is always ready at Ratal Foods.
                        </h2>
                        <p className="font-body text-background/75 mt-4 text-base leading-relaxed">{footerContent.tagline}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center p-6 md:p-10">
                <Link href="/" className="mb-8 lg:hidden">
                    <BrandLogo className="h-16 w-auto max-w-[220px] object-contain" />
                </Link>

                <div className={`border-border w-full ${wide ? 'max-w-2xl' : 'max-w-md'} rounded-xl border bg-white p-8 shadow-sm sm:p-10`}>
                    <div className="mb-8 space-y-2 text-center">
                        <div className="bg-primary mx-auto mb-4 h-1 w-10 rounded-full" />
                        <h1 className="font-heading text-3xl tracking-tight">{title}</h1>
                        <p className="font-body text-muted-foreground text-sm">{description}</p>
                    </div>
                    {children}
                </div>

                <Link href="/" className="font-body text-muted-foreground hover:text-foreground mt-8 text-sm transition-colors">
                    ← Back to Ratal Foods
                </Link>
            </div>
        </div>
    );
}
