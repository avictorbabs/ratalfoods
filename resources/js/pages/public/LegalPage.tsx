import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

type LegalPageContent = {
    title: string;
    updated_on: string;
    body: string;
};

// The text is written by the store owner in the admin, so it is rendered as HTML.
const bodyClass =
    'font-body text-muted-foreground text-base leading-relaxed ' +
    '[&_h2]:font-heading [&_h2]:text-foreground [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:tracking-tight ' +
    '[&_h3]:font-heading [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-lg ' +
    '[&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1.5 ' +
    '[&_strong]:text-foreground [&_a]:text-primary [&_a]:underline';

export default function LegalPage({ pageContent }: { pageContent: LegalPageContent }) {
    return (
        <AppLayout>
            <Head title={pageContent.title} />

            <section className="bg-background px-4 pt-28 pb-16 sm:pt-32 sm:pb-20">
                <div className="mx-auto max-w-3xl">
                    <PageBreadcrumb items={[{ title: 'Home', href: '/' }, { title: pageContent.title }]} />

                    <div className="border-border mt-4 rounded-xl border bg-white p-6 shadow-sm sm:p-10">
                        <p className="font-body text-muted-foreground text-xs tracking-[0.3em] uppercase">Legal</p>
                        <h1 className="font-heading mt-2 text-3xl tracking-tight sm:text-4xl">{pageContent.title}</h1>
                        {pageContent.updated_on && (
                            <p className="font-body text-muted-foreground mt-2 text-sm">Last updated: {pageContent.updated_on}</p>
                        )}

                        <div className={`${bodyClass} mt-8`} dangerouslySetInnerHTML={{ __html: pageContent.body }} />
                    </div>
                </div>
            </section>
        </AppLayout>
    );
}
