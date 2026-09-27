import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';

type FaqContent = {
    title: string;
    intro: string;
    items: { question: string; answer: string }[];
};

export default function Faq({ pageContent }: { pageContent: FaqContent }) {
    const items = pageContent.items.filter((item) => item.question.trim() !== '' && item.answer.trim() !== '');

    // Lets search engines show the questions as rich results. "<" is escaped so the text can never close the script tag.
    const structuredData = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
    }).replace(/</g, '\\u003c');

    return (
        <AppLayout>
            <Head title={pageContent.title}>
                <script type="application/ld+json">{structuredData}</script>
            </Head>

            <section className="bg-background px-4 pt-28 pb-16 sm:pt-32 sm:pb-20">
                <div className="mx-auto max-w-3xl">
                    <PageBreadcrumb items={[{ title: 'Home', href: '/' }, { title: 'FAQ' }]} />

                    <div className="border-border mt-4 rounded-xl border bg-white p-6 shadow-sm sm:p-10">
                        <p className="font-body text-muted-foreground text-xs tracking-[0.3em] uppercase">Help</p>
                        <h1 className="font-heading mt-2 text-3xl tracking-tight sm:text-4xl">{pageContent.title}</h1>
                        {pageContent.intro && <p className="font-body text-muted-foreground mt-3 text-base leading-relaxed">{pageContent.intro}</p>}

                        <div className="divide-border border-border mt-8 divide-y rounded-lg border">
                            {items.map((item, index) => (
                                <details key={index} className="group px-5 py-4">
                                    <summary className="font-body text-foreground flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium [&::-webkit-details-marker]:hidden">
                                        {item.question}
                                        <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
                                    </summary>
                                    <p className="font-body text-muted-foreground mt-3 text-sm leading-relaxed whitespace-pre-line">{item.answer}</p>
                                </details>
                            ))}
                        </div>

                        <div className="bg-muted/50 mt-8 rounded-lg p-5 text-center">
                            <p className="font-body text-sm">Still have a question?</p>
                            <Link href="/contact" className="font-body text-primary mt-1 inline-block text-sm font-medium hover:underline">
                                Contact us
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </AppLayout>
    );
}
