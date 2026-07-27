import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

const aboutImage1 = '/images/about-us/about1.webp';
const aboutImage2 = '/images/about-us/about2.webp';

export default function About() {
    return (
        <AppLayout>
            <Head title="About Us" />

            <div>
                <section className="relative h-64 overflow-hidden pt-20 sm:h-80 sm:pt-24">
                    <img
                        src="https://media.base44.com/images/public/6a2f8570f73aa7ad1929a1a5/c2233b586_generated_51c27708.png"
                        alt="Nigerian food spread"
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-foreground/60" />
                    <div className="relative z-10 flex h-full items-center justify-center px-4 text-center">
                        <div>
                            <p className="mb-3 font-body text-xs uppercase tracking-[0.3em] text-background/70">
                                Our Story
                            </p>
                            <h1 className="font-heading text-4xl tracking-tight text-background sm:text-5xl">
                                About Us
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
                                src={aboutImage1}
                                alt="Grilled fish with pepper stew and fried plantain"
                                className="aspect-[4/3] w-full object-cover"
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <h1 className="font-heading text-[36px] leading-[1.15] tracking-tight italic">
                                Bringing Passion for Nigerian Cuisine to Canada
                            </h1>
                            <p className="mt-6 font-body text-base leading-relaxed text-muted-foreground">
                                Ratal Foods was founded by Augustina, whose culinary journey began
                                in her small kitchen, cooking for intimate gatherings. After running
                                her own establishment for several years, she migrated to Canada in
                                2017, eager to continue her passion for Nigerian cuisine.
                            </p>
                            <Button
                                size="lg"
                                className="mt-8 h-12 rounded-sm bg-primary px-8 font-body text-sm font-medium tracking-wide text-primary-foreground uppercase hover:bg-primary/90"
                                asChild
                            >
                                <Link href="/menu">Explore Our Menu</Link>
                            </Button>
                        </motion.div>
                    </div>
                    </div>
                </section>

                <section className="bg-muted/50 py-14 sm:py-20">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4 }}
                            >
                                <h2 className="font-body text-xl font-medium tracking-tight text-foreground sm:text-2xl">
                                    Building Skills and Experience
                                </h2>
                                <p className="mt-4 font-body text-base leading-relaxed text-muted-foreground">
                                    Upon arriving in Canada, Augustina enrolled at St. Clair
                                    College, where she earned a diploma in Culinary and Art
                                    Management. Determined to enhance her skills, she pursued a
                                    diploma in Hospitality Management and completed an internship at
                                    Walt Disney World, gaining invaluable experience in the industry.
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: 0.1 }}
                            >
                                <h2 className="font-body text-xl font-medium tracking-tight text-foreground sm:text-2xl">
                                    The Beginning of Something Special
                                </h2>
                                <p className="mt-4 font-body text-base leading-relaxed text-muted-foreground">
                                    In 2024, after completing the Cook-Up Incubator Program,
                                    Augustina launched Ratal Foods. Their first appearance at the
                                    Downtown Windsor Farmers Market was met with overwhelming
                                    success, with positive reviews and great sales.
                                </p>
                            </motion.div>
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
                                    Celebrating Culture and Community
                                </h2>
                                <p className="mt-4 font-body text-base leading-relaxed text-muted-foreground">
                                    With the Nigerian community in Windsor rapidly expanding, Ratal
                                    Foods is proud to serve authentic Nigerian dishes and create an
                                    inviting space for all to enjoy true flavors of Nigeria in
                                    Ontario.
                                </p>
                                <Button
                                    size="lg"
                                    className="mt-8 h-12 rounded-sm bg-primary px-8 font-body text-sm font-medium tracking-wide text-primary-foreground uppercase hover:bg-primary/90"
                                    asChild
                                >
                                    <Link href="/contact">Visit Us Today</Link>
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
                                    src={aboutImage2}
                                    alt="Beans, fried plantain, and bread — a classic Nigerian meal"
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
