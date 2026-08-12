import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { AboutPageContent } from '@/types/ratalfoods';

type AboutProps = {
    pageContent: AboutPageContent;
};

export default function About({ pageContent }: AboutProps) {
    const { hero, story, history, culture } = pageContent;

    return (
        <AppLayout>
            <Head title="About Us" />

            <div>
                <section className="relative h-64 overflow-hidden pt-20 sm:h-80 sm:pt-24">
                    <img
                        src={hero.image}
                        alt="Nigerian food spread"
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-foreground/60" />
                    <div className="relative z-10 flex h-full items-center justify-center px-4 text-center">
                        <div>
                            <p className="mb-3 font-body text-xs uppercase tracking-[0.3em] text-background/70">
                                {hero.eyebrow}
                            </p>
                            <h1 className="font-heading text-4xl tracking-tight text-background sm:text-5xl">
                                {hero.title}
                            </h1>
                        </div>
                    </div>
                </section>

                <section className="bg-white">
                    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <PageBreadcrumb
                        items={[
                            { title: 'Home', href: '/' },
                            { title: 'About Us' },
                        ]}
                    />

                    <div className="mt-8 grid grid-cols-1 items-center gap-10 pb-12 sm:pb-16 lg:grid-cols-2 lg:gap-16 lg:pb-20">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                            className="overflow-hidden rounded-md"
                        >
                            <img
                                src={story.image}
                                alt={story.heading}
                                className="aspect-[4/3] w-full object-cover"
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <h1 className="font-heading text-[36px] leading-[1.15] tracking-tight italic">
                                {story.heading}
                            </h1>
                            <p className="mt-6 font-body text-base leading-relaxed text-muted-foreground">
                                {story.body}
                            </p>
                            <Button
                                size="lg"
                                className="mt-8 h-12 rounded-sm bg-primary px-8 font-body text-sm font-medium tracking-wide text-primary-foreground uppercase hover:bg-primary/90"
                                asChild
                            >
                                <Link href={story.cta_href}>{story.cta_label}</Link>
                            </Button>
                        </motion.div>
                    </div>
                    </div>
                </section>

                <section className="bg-muted/50 py-14 sm:py-20">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
                            {history.map((block, index) => (
                                <motion.div
                                    key={block.heading}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                >
                                    <h2 className="font-body text-xl font-medium tracking-tight text-foreground sm:text-2xl">
                                        {block.heading}
                                    </h2>
                                    <p className="mt-4 font-body text-base leading-relaxed text-muted-foreground">
                                        {block.body}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="border-b-4 border-primary bg-white pb-8 sm:pb-10">
                    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
                        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4 }}
                            >
                                <h2 className="font-body text-xl font-medium tracking-tight text-foreground sm:text-2xl">
                                    {culture.heading}
                                </h2>
                                <p className="mt-4 font-body text-base leading-relaxed text-muted-foreground">
                                    {culture.body}
                                </p>
                                <Button
                                    size="lg"
                                    className="mt-8 h-12 rounded-sm bg-primary px-8 font-body text-sm font-medium tracking-wide text-primary-foreground uppercase hover:bg-primary/90"
                                    asChild
                                >
                                    <Link href={culture.cta_href}>{culture.cta_label}</Link>
                                </Button>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: 0.1 }}
                                className="overflow-hidden rounded-md"
                            >
                                <img
                                    src={culture.image}
                                    alt={culture.heading}
                                    className="aspect-[4/3] w-full object-cover"
                                />
                            </motion.div>
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
