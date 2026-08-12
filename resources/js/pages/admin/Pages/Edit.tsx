import { Head, useForm, usePage } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { FormEvent, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/layouts/dashboard-layout';
import type { PageSlug, SharedData } from '@/types/ratalfoods';

type PageFormData = {
    content: Record<string, unknown>;
    hero_image: File | null;
    story_image: File | null;
    culture_image: File | null;
    why_slide_0_image: File | null;
    why_slide_1_image: File | null;
    why_slide_2_image: File | null;
    board_left_top: File | null;
    board_left_bottom: File | null;
    board_right: File | null;
    showcase_1: File | null;
    showcase_2: File | null;
    footer_logo: File | null;
};

type EditProps = {
    slug: PageSlug;
    label: string;
    pageContent: Record<string, unknown>;
};

type FileField = Exclude<keyof PageFormData, 'content'>;

function asRecord(value: unknown): Record<string, unknown> {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }

    return {};
}

function asList(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

function setPath(
    root: Record<string, unknown>,
    path: Array<string | number>,
    value: unknown,
): Record<string, unknown> {
    const next = structuredClone(root);
    let cursor: unknown = next;

    for (let index = 0; index < path.length - 1; index += 1) {
        const key = path[index];

        if (typeof key === 'number') {
            if (!Array.isArray(cursor)) {
                return next;
            }

            cursor = cursor[key];
            continue;
        }

        if (typeof cursor !== 'object' || cursor === null || Array.isArray(cursor)) {
            return next;
        }

        cursor = (cursor as Record<string, unknown>)[key];
    }

    const last = path[path.length - 1];

    if (typeof last === 'number') {
        if (Array.isArray(cursor)) {
            cursor[last] = value;
        }
    } else if (typeof cursor === 'object' && cursor !== null && !Array.isArray(cursor)) {
        (cursor as Record<string, unknown>)[last] = value;
    }

    return next;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-heading text-lg tracking-tight">{title}</h2>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{children}</div>
        </section>
    );
}

function TextField({
    id,
    label,
    value,
    onChange,
    className,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    className?: string;
}) {
    return (
        <div className={className}>
            <Label htmlFor={id}>{label}</Label>
            <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5" />
        </div>
    );
}

function AreaField({
    id,
    label,
    value,
    onChange,
    rows = 4,
    className,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    rows?: number;
    className?: string;
}) {
    return (
        <div className={className}>
            <Label htmlFor={id}>{label}</Label>
            <Textarea
                id={id}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                rows={rows}
                className="mt-1.5"
            />
        </div>
    );
}

function ImageField({
    id,
    label,
    currentUrl,
    error,
    onFile,
}: {
    id: string;
    label: string;
    currentUrl: string;
    error?: string;
    onFile: (file: File | null) => void;
}) {
    return (
        <div>
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(event) => onFile(event.target.files?.[0] ?? null)}
                className="mt-1.5"
            />
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
            {currentUrl && (
                <div className="mt-3 h-28 w-44 overflow-hidden rounded-md border border-border">
                    <img src={currentUrl} alt={`${label} preview`} className="h-full w-full object-cover" />
                </div>
            )}
        </div>
    );
}

export default function PageEdit({ slug, label, pageContent }: EditProps) {
    const { flash } = usePage<SharedData>().props;
    const { data, setData, put, processing, errors } = useForm<PageFormData>({
        content: pageContent,
        hero_image: null,
        story_image: null,
        culture_image: null,
        why_slide_0_image: null,
        why_slide_1_image: null,
        why_slide_2_image: null,
        board_left_top: null,
        board_left_bottom: null,
        board_right: null,
        showcase_1: null,
        showcase_2: null,
        footer_logo: null,
    });

    const content = data.content;
    const hero = asRecord(content.hero);

    const setContent = (path: Array<string | number>, value: unknown) => {
        setData('content', setPath(data.content, path, value));
    };

    const previewUrl = (current: string, file: File | null): string => {
        return file ? URL.createObjectURL(file) : current;
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        put(`/admin/pages/${slug}`, { forceFormData: true });
    };

    const whySlides = asList(asRecord(content.why).slides);
    const perks = asList(content.perks);
    const history = asList(content.history);
    const bookingTypes = asList(content.types);
    const menuDetails = asList(content.details);
    const featuredBlocks = asList(content.featured);
    const categories = asRecord(content.categories);
    const featured = asRecord(content.featured);
    const why = asRecord(content.why);
    const cta = asRecord(content.cta);
    const newsletter = asRecord(content.newsletter);
    const blog = asRecord(content.blog);
    const story = asRecord(content.story);
    const culture = asRecord(content.culture);
    const intro = asRecord(content.intro);
    const success = asRecord(content.success);

    return (
        <DashboardLayout
            variant="admin"
            title={`Edit ${label}`}
            subtitle="Update page copy, images, and calls to action"
        >
            <Head title={`Edit ${label} — Admin`} />

            <form onSubmit={submit} className="space-y-6">
                {flash.success && (
                    <div className="rounded-md border border-accent/30 bg-accent/10 px-4 py-3 font-body text-sm text-accent">
                        {flash.success}
                    </div>
                )}

                {slug !== 'footer' && (
                <Section title="Hero">
                    <ImageField
                        id="hero_image"
                        label="Hero image"
                        currentUrl={previewUrl(asString(hero.image), data.hero_image)}
                        error={errors.hero_image}
                        onFile={(file) => setData('hero_image', file)}
                    />
                    {hero.eyebrow !== undefined && (
                        <TextField
                            id="hero_eyebrow"
                            label="Eyebrow"
                            value={asString(hero.eyebrow)}
                            onChange={(value) => setContent(['hero', 'eyebrow'], value)}
                        />
                    )}
                    <TextField
                        id="hero_title"
                        label="Title"
                        value={asString(hero.title)}
                        onChange={(value) => setContent(['hero', 'title'], value)}
                    />
                    {hero.title_line_2 !== undefined && (
                        <TextField
                            id="hero_title_line_2"
                            label="Title line 2"
                            value={asString(hero.title_line_2)}
                            onChange={(value) => setContent(['hero', 'title_line_2'], value)}
                            className="lg:col-span-2"
                        />
                    )}
                    {hero.body !== undefined && (
                        <AreaField
                            id="hero_body"
                            label="Body"
                            value={asString(hero.body)}
                            onChange={(value) => setContent(['hero', 'body'], value)}
                            className="lg:col-span-2"
                        />
                    )}
                    {hero.cta_primary_label !== undefined && (
                        <>
                            <TextField
                                id="hero_cta_primary_label"
                                label="Primary CTA label"
                                value={asString(hero.cta_primary_label)}
                                onChange={(value) => setContent(['hero', 'cta_primary_label'], value)}
                            />
                            <TextField
                                id="hero_cta_primary_href"
                                label="Primary CTA link"
                                value={asString(hero.cta_primary_href)}
                                onChange={(value) => setContent(['hero', 'cta_primary_href'], value)}
                            />
                            <TextField
                                id="hero_cta_secondary_label"
                                label="Secondary CTA label"
                                value={asString(hero.cta_secondary_label)}
                                onChange={(value) => setContent(['hero', 'cta_secondary_label'], value)}
                            />
                            <TextField
                                id="hero_cta_secondary_href"
                                label="Secondary CTA link"
                                value={asString(hero.cta_secondary_href)}
                                onChange={(value) => setContent(['hero', 'cta_secondary_href'], value)}
                            />
                        </>
                    )}
                </Section>
                )}

                {slug === 'home' && (
                    <>
                        <Section title="Perks">
                            {perks.map((perk, index) => {
                                const item = asRecord(perk);

                                return (
                                    <div key={index} className="space-y-3 rounded-lg border border-border p-4">
                                        <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">
                                            Perk {index + 1}
                                        </p>
                                        <TextField
                                            id={`perk_${index}_title`}
                                            label="Title"
                                            value={asString(item.title)}
                                            onChange={(value) => setContent(['perks', index, 'title'], value)}
                                        />
                                        <TextField
                                            id={`perk_${index}_description`}
                                            label="Description"
                                            value={asString(item.description)}
                                            onChange={(value) => setContent(['perks', index, 'description'], value)}
                                        />
                                    </div>
                                );
                            })}
                        </Section>

                        <Section title="Shop by Category">
                            <TextField
                                id="categories_eyebrow"
                                label="Eyebrow"
                                value={asString(categories.eyebrow)}
                                onChange={(value) => setContent(['categories', 'eyebrow'], value)}
                            />
                            <TextField
                                id="categories_heading"
                                label="Heading"
                                value={asString(categories.heading)}
                                onChange={(value) => setContent(['categories', 'heading'], value)}
                            />
                            <TextField
                                id="categories_link_label"
                                label="Link label"
                                value={asString(categories.link_label)}
                                onChange={(value) => setContent(['categories', 'link_label'], value)}
                            />
                        </Section>

                        <Section title="Featured Dishes">
                            <TextField
                                id="featured_eyebrow"
                                label="Eyebrow"
                                value={asString(featured.eyebrow)}
                                onChange={(value) => setContent(['featured', 'eyebrow'], value)}
                            />
                            <TextField
                                id="featured_heading"
                                label="Heading"
                                value={asString(featured.heading)}
                                onChange={(value) => setContent(['featured', 'heading'], value)}
                            />
                            <TextField
                                id="featured_link_label"
                                label="Link label"
                                value={asString(featured.link_label)}
                                onChange={(value) => setContent(['featured', 'link_label'], value)}
                            />
                            <TextField
                                id="featured_mobile_link_label"
                                label="Mobile link label"
                                value={asString(featured.mobile_link_label)}
                                onChange={(value) => setContent(['featured', 'mobile_link_label'], value)}
                            />
                        </Section>

                        <Section title="Why Choose Us">
                            <TextField
                                id="why_eyebrow"
                                label="Eyebrow"
                                value={asString(why.eyebrow)}
                                onChange={(value) => setContent(['why', 'eyebrow'], value)}
                            />
                            <TextField
                                id="why_heading"
                                label="Heading"
                                value={asString(why.heading)}
                                onChange={(value) => setContent(['why', 'heading'], value)}
                            />
                            {whySlides.map((slide, index) => {
                                const item = asRecord(slide);
                                const fileKey = `why_slide_${index}_image` as FileField;

                                return (
                                    <div key={index} className="space-y-3 rounded-lg border border-border p-4 lg:col-span-2">
                                        <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">
                                            Slide {index + 1}
                                        </p>
                                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                            <ImageField
                                                id={fileKey}
                                                label="Image"
                                                currentUrl={previewUrl(asString(item.image), data[fileKey])}
                                                error={errors[fileKey]}
                                                onFile={(file) => setData(fileKey, file)}
                                            />
                                            <TextField
                                                id={`why_${index}_image_alt`}
                                                label="Image alt text"
                                                value={asString(item.image_alt)}
                                                onChange={(value) => setContent(['why', 'slides', index, 'image_alt'], value)}
                                            />
                                            <TextField
                                                id={`why_${index}_title`}
                                                label="Title"
                                                value={asString(item.title)}
                                                onChange={(value) => setContent(['why', 'slides', index, 'title'], value)}
                                                className="lg:col-span-2"
                                            />
                                            <AreaField
                                                id={`why_${index}_description`}
                                                label="Body"
                                                value={asString(item.description)}
                                                onChange={(value) =>
                                                    setContent(['why', 'slides', index, 'description'], value)
                                                }
                                                className="lg:col-span-2"
                                            />
                                            <TextField
                                                id={`why_${index}_cta_label`}
                                                label="CTA label"
                                                value={asString(item.cta_label)}
                                                onChange={(value) => setContent(['why', 'slides', index, 'cta_label'], value)}
                                            />
                                            <TextField
                                                id={`why_${index}_cta_href`}
                                                label="CTA link"
                                                value={asString(item.cta_href)}
                                                onChange={(value) => setContent(['why', 'slides', index, 'cta_href'], value)}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </Section>

                        <Section title="Taste the Difference">
                            <TextField
                                id="cta_heading"
                                label="Heading"
                                value={asString(cta.heading)}
                                onChange={(value) => setContent(['cta', 'heading'], value)}
                            />
                            <AreaField
                                id="cta_body"
                                label="Body"
                                value={asString(cta.body)}
                                onChange={(value) => setContent(['cta', 'body'], value)}
                                className="lg:col-span-2"
                            />
                            <TextField
                                id="cta_primary_label"
                                label="Primary CTA label"
                                value={asString(cta.primary_label)}
                                onChange={(value) => setContent(['cta', 'primary_label'], value)}
                            />
                            <TextField
                                id="cta_primary_href"
                                label="Primary CTA link"
                                value={asString(cta.primary_href)}
                                onChange={(value) => setContent(['cta', 'primary_href'], value)}
                            />
                            <TextField
                                id="cta_secondary_label"
                                label="Secondary CTA label"
                                value={asString(cta.secondary_label)}
                                onChange={(value) => setContent(['cta', 'secondary_label'], value)}
                            />
                            <TextField
                                id="cta_secondary_href"
                                label="Secondary CTA link"
                                value={asString(cta.secondary_href)}
                                onChange={(value) => setContent(['cta', 'secondary_href'], value)}
                            />
                        </Section>

                        <Section title="Newsletter">
                            <TextField
                                id="newsletter_eyebrow"
                                label="Eyebrow"
                                value={asString(newsletter.eyebrow)}
                                onChange={(value) => setContent(['newsletter', 'eyebrow'], value)}
                            />
                            <TextField
                                id="newsletter_heading"
                                label="Heading"
                                value={asString(newsletter.heading)}
                                onChange={(value) => setContent(['newsletter', 'heading'], value)}
                            />
                            <AreaField
                                id="newsletter_body"
                                label="Body"
                                value={asString(newsletter.body)}
                                onChange={(value) => setContent(['newsletter', 'body'], value)}
                                className="lg:col-span-2"
                            />
                            <TextField
                                id="newsletter_button_label"
                                label="Button label"
                                value={asString(newsletter.button_label)}
                                onChange={(value) => setContent(['newsletter', 'button_label'], value)}
                            />
                        </Section>

                        <Section title="Blog">
                            <TextField
                                id="blog_eyebrow"
                                label="Eyebrow"
                                value={asString(blog.eyebrow)}
                                onChange={(value) => setContent(['blog', 'eyebrow'], value)}
                            />
                            <TextField
                                id="blog_heading"
                                label="Heading"
                                value={asString(blog.heading)}
                                onChange={(value) => setContent(['blog', 'heading'], value)}
                            />
                            <TextField
                                id="blog_link_label"
                                label="Link label"
                                value={asString(blog.link_label)}
                                onChange={(value) => setContent(['blog', 'link_label'], value)}
                            />
                        </Section>
                    </>
                )}

                {slug === 'about' && (
                    <>
                        <Section title="Story">
                            <ImageField
                                id="story_image"
                                label="Story image"
                                currentUrl={previewUrl(asString(story.image), data.story_image)}
                                error={errors.story_image}
                                onFile={(file) => setData('story_image', file)}
                            />
                            <TextField
                                id="story_heading"
                                label="Heading"
                                value={asString(story.heading)}
                                onChange={(value) => setContent(['story', 'heading'], value)}
                            />
                            <AreaField
                                id="story_body"
                                label="Body"
                                value={asString(story.body)}
                                onChange={(value) => setContent(['story', 'body'], value)}
                                rows={6}
                                className="lg:col-span-2"
                            />
                            <TextField
                                id="story_cta_label"
                                label="CTA label"
                                value={asString(story.cta_label)}
                                onChange={(value) => setContent(['story', 'cta_label'], value)}
                            />
                            <TextField
                                id="story_cta_href"
                                label="CTA link"
                                value={asString(story.cta_href)}
                                onChange={(value) => setContent(['story', 'cta_href'], value)}
                            />
                        </Section>

                        <Section title="History">
                            {history.map((block, index) => {
                                const item = asRecord(block);

                                return (
                                    <div key={index} className="space-y-3 rounded-lg border border-border p-4">
                                        <TextField
                                            id={`history_${index}_heading`}
                                            label="Heading"
                                            value={asString(item.heading)}
                                            onChange={(value) => setContent(['history', index, 'heading'], value)}
                                        />
                                        <AreaField
                                            id={`history_${index}_body`}
                                            label="Body"
                                            value={asString(item.body)}
                                            onChange={(value) => setContent(['history', index, 'body'], value)}
                                            rows={5}
                                        />
                                    </div>
                                );
                            })}
                        </Section>

                        <Section title="Culture">
                            <TextField
                                id="culture_heading"
                                label="Heading"
                                value={asString(culture.heading)}
                                onChange={(value) => setContent(['culture', 'heading'], value)}
                            />
                            <AreaField
                                id="culture_body"
                                label="Body"
                                value={asString(culture.body)}
                                onChange={(value) => setContent(['culture', 'body'], value)}
                                rows={5}
                                className="lg:col-span-2"
                            />
                            <TextField
                                id="culture_cta_label"
                                label="CTA label"
                                value={asString(culture.cta_label)}
                                onChange={(value) => setContent(['culture', 'cta_label'], value)}
                            />
                            <TextField
                                id="culture_cta_href"
                                label="CTA link"
                                value={asString(culture.cta_href)}
                                onChange={(value) => setContent(['culture', 'cta_href'], value)}
                            />
                            <ImageField
                                id="culture_image"
                                label="Culture image"
                                currentUrl={previewUrl(asString(culture.image), data.culture_image)}
                                error={errors.culture_image}
                                onFile={(file) => setData('culture_image', file)}
                            />
                        </Section>
                    </>
                )}

                {slug === 'contact' && (
                    <>
                        <Section title="Intro">
                            <TextField
                                id="intro_eyebrow"
                                label="Eyebrow"
                                value={asString(intro.eyebrow)}
                                onChange={(value) => setContent(['intro', 'eyebrow'], value)}
                            />
                            <TextField
                                id="intro_heading"
                                label="Heading"
                                value={asString(intro.heading)}
                                onChange={(value) => setContent(['intro', 'heading'], value)}
                            />
                            <AreaField
                                id="intro_body"
                                label="Body"
                                value={asString(intro.body)}
                                onChange={(value) => setContent(['intro', 'body'], value)}
                                className="lg:col-span-2"
                            />
                        </Section>

                        <Section title="Contact details">
                            <TextField
                                id="location_label"
                                label="Location label"
                                value={asString(content.location_label)}
                                onChange={(value) => setContent(['location_label'], value)}
                            />
                            <AreaField
                                id="location"
                                label="Location"
                                value={asString(content.location)}
                                onChange={(value) => setContent(['location'], value)}
                                rows={2}
                            />
                            <TextField
                                id="phone_label"
                                label="Phone label"
                                value={asString(content.phone_label)}
                                onChange={(value) => setContent(['phone_label'], value)}
                            />
                            <TextField
                                id="phone"
                                label="Phone"
                                value={asString(content.phone)}
                                onChange={(value) => setContent(['phone'], value)}
                            />
                            <TextField
                                id="email_label"
                                label="Email label"
                                value={asString(content.email_label)}
                                onChange={(value) => setContent(['email_label'], value)}
                            />
                            <TextField
                                id="email"
                                label="Email"
                                value={asString(content.email)}
                                onChange={(value) => setContent(['email'], value)}
                            />
                            <TextField
                                id="whatsapp_url"
                                label="WhatsApp URL"
                                value={asString(content.whatsapp_url)}
                                onChange={(value) => setContent(['whatsapp_url'], value)}
                            />
                            <TextField
                                id="whatsapp_label"
                                label="WhatsApp label"
                                value={asString(content.whatsapp_label)}
                                onChange={(value) => setContent(['whatsapp_label'], value)}
                            />
                            <TextField
                                id="map_heading"
                                label="Map heading"
                                value={asString(content.map_heading)}
                                onChange={(value) => setContent(['map_heading'], value)}
                            />
                        </Section>
                    </>
                )}

                {slug === 'booking' && (
                    <>
                        <Section title="Booking types">
                            {bookingTypes.map((type, index) => {
                                const item = asRecord(type);

                                return (
                                    <div key={asString(item.value) || index} className="space-y-3 rounded-lg border border-border p-4">
                                        <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">
                                            {asString(item.value)}
                                        </p>
                                        <TextField
                                            id={`booking_type_${index}_label`}
                                            label="Label"
                                            value={asString(item.label)}
                                            onChange={(value) => setContent(['types', index, 'label'], value)}
                                        />
                                        <TextField
                                            id={`booking_type_${index}_description`}
                                            label="Description"
                                            value={asString(item.description)}
                                            onChange={(value) => setContent(['types', index, 'description'], value)}
                                        />
                                    </div>
                                );
                            })}
                        </Section>

                        <Section title="Success message">
                            <TextField
                                id="success_heading"
                                label="Heading"
                                value={asString(success.heading)}
                                onChange={(value) => setContent(['success', 'heading'], value)}
                            />
                            <AreaField
                                id="success_confirm_copy"
                                label="Confirmation copy"
                                value={asString(success.confirm_copy)}
                                onChange={(value) => setContent(['success', 'confirm_copy'], value)}
                            />
                            <TextField
                                id="success_cta_label"
                                label="CTA label"
                                value={asString(success.cta_label)}
                                onChange={(value) => setContent(['success', 'cta_label'], value)}
                            />
                        </Section>
                    </>
                )}

                {slug === 'menu' && (
                    <>
                        <Section title="Menu details">
                            <TextField
                                id="details_button_label"
                                label="Accordion button label"
                                value={asString(content.details_button_label)}
                                onChange={(value) => setContent(['details_button_label'], value)}
                                className="lg:col-span-2"
                            />
                            {menuDetails.map((section, index) => {
                                const item = asRecord(section);
                                const items = asList(item.items);

                                return (
                                    <div key={index} className="space-y-3 rounded-lg border border-border p-4 lg:col-span-2">
                                        <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">
                                            Section {index + 1}
                                        </p>
                                        <TextField
                                            id={`menu_section_${index}_title`}
                                            label="Title"
                                            value={asString(item.title)}
                                            onChange={(value) => setContent(['details', index, 'title'], value)}
                                        />
                                        <AreaField
                                            id={`menu_section_${index}_description`}
                                            label="Description"
                                            value={asString(item.description)}
                                            onChange={(value) => setContent(['details', index, 'description'], value)}
                                        />
                                        {index > 2 && (
                                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                                <TextField
                                                    id={`menu_section_${index}_cta_label`}
                                                    label="CTA label"
                                                    value={asString(item.cta_label)}
                                                    onChange={(value) =>
                                                        setContent(['details', index, 'cta_label'], value)
                                                    }
                                                />
                                                <TextField
                                                    id={`menu_section_${index}_cta_category`}
                                                    label="CTA category"
                                                    value={asString(item.cta_category)}
                                                    onChange={(value) =>
                                                        setContent(['details', index, 'cta_category'], value)
                                                    }
                                                />
                                            </div>
                                        )}
                                        <div className="space-y-3">
                                            {items.map((menuItem, itemIndex) => {
                                                const row = asRecord(menuItem);

                                                return (
                                                    <div
                                                        key={itemIndex}
                                                        className="grid grid-cols-1 gap-3 rounded-md border border-border p-3 sm:grid-cols-[1fr_1fr_auto]"
                                                    >
                                                        <TextField
                                                            id={`menu_item_${index}_${itemIndex}_name`}
                                                            label="Item name"
                                                            value={asString(row.name)}
                                                            onChange={(value) =>
                                                                setContent(
                                                                    ['details', index, 'items', itemIndex, 'name'],
                                                                    value,
                                                                )
                                                            }
                                                        />
                                                        <TextField
                                                            id={`menu_item_${index}_${itemIndex}_description`}
                                                            label="Item description"
                                                            value={asString(row.description)}
                                                            onChange={(value) =>
                                                                setContent(
                                                                    [
                                                                        'details',
                                                                        index,
                                                                        'items',
                                                                        itemIndex,
                                                                        'description',
                                                                    ],
                                                                    value,
                                                                )
                                                            }
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="mt-6"
                                                            onClick={() => {
                                                                const next = items.filter((_, current) => current !== itemIndex);
                                                                setContent(['details', index, 'items'], next);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            <span className="sr-only">Remove item</span>
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setContent(['details', index, 'items'], [
                                                        ...items,
                                                        { name: '', description: '' },
                                                    ]);
                                                }}
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add item
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </Section>

                        <Section title="Menu boards">
                            <ImageField
                                id="board_left_top"
                                label="Left top board"
                                currentUrl={previewUrl(asString(content.board_left_top), data.board_left_top)}
                                error={errors.board_left_top}
                                onFile={(file) => setData('board_left_top', file)}
                            />
                            <ImageField
                                id="board_left_bottom"
                                label="Left bottom board"
                                currentUrl={previewUrl(asString(content.board_left_bottom), data.board_left_bottom)}
                                error={errors.board_left_bottom}
                                onFile={(file) => setData('board_left_bottom', file)}
                            />
                            <ImageField
                                id="board_right"
                                label="Right collage"
                                currentUrl={previewUrl(asString(content.board_right), data.board_right)}
                                error={errors.board_right}
                                onFile={(file) => setData('board_right', file)}
                            />
                        </Section>
                    </>
                )}

                {slug === 'gallery' && (
                    <>
                        <Section title="Section heading">
                            <TextField
                                id="gallery_heading"
                                label="Heading"
                                value={asString(content.heading)}
                                onChange={(value) => setContent(['heading'], value)}
                                className="lg:col-span-2"
                            />
                        </Section>

                        <Section title="Featured blocks">
                            {featuredBlocks.map((block, index) => {
                                const item = asRecord(block);

                                return (
                                    <div key={index} className="space-y-3 rounded-lg border border-border p-4">
                                        <TextField
                                            id={`gallery_featured_${index}_title`}
                                            label="Title"
                                            value={asString(item.title)}
                                            onChange={(value) => setContent(['featured', index, 'title'], value)}
                                        />
                                        <AreaField
                                            id={`gallery_featured_${index}_description`}
                                            label="Description"
                                            value={asString(item.description)}
                                            onChange={(value) => setContent(['featured', index, 'description'], value)}
                                            rows={6}
                                        />
                                    </div>
                                );
                            })}
                        </Section>

                        <Section title="Showcase images">
                            <ImageField
                                id="showcase_1"
                                label="Showcase image 1"
                                currentUrl={previewUrl(asString(content.showcase_1), data.showcase_1)}
                                error={errors.showcase_1}
                                onFile={(file) => setData('showcase_1', file)}
                            />
                            <ImageField
                                id="showcase_2"
                                label="Showcase image 2"
                                currentUrl={previewUrl(asString(content.showcase_2), data.showcase_2)}
                                error={errors.showcase_2}
                                onFile={(file) => setData('showcase_2', file)}
                            />
                        </Section>
                    </>
                )}

                {slug === 'footer' && (
                    <>
                        <Section title="Brand">
                            <ImageField
                                id="footer_logo"
                                label="Logo"
                                currentUrl={previewUrl(asString(content.logo), data.footer_logo)}
                                error={errors.footer_logo}
                                onFile={(file) => setData('footer_logo', file)}
                            />
                            <TextField
                                id="footer_brand_name"
                                label="Brand name"
                                value={asString(content.brand_name)}
                                onChange={(value) => setContent(['brand_name'], value)}
                            />
                            <TextField
                                id="footer_phone"
                                label="Phone"
                                value={asString(content.phone)}
                                onChange={(value) => setContent(['phone'], value)}
                            />
                            <AreaField
                                id="footer_tagline"
                                label="Tagline"
                                value={asString(content.tagline)}
                                onChange={(value) => setContent(['tagline'], value)}
                                className="lg:col-span-2"
                            />
                        </Section>

                        <Section title="Taste Map">
                            <TextField
                                id="taste_map_heading"
                                label="Heading"
                                value={asString(content.taste_map_heading)}
                                onChange={(value) => setContent(['taste_map_heading'], value)}
                                className="lg:col-span-2"
                            />
                            {asList(content.taste_map).map((link, index) => {
                                const item = asRecord(link);

                                return (
                                    <div
                                        key={index}
                                        className="grid grid-cols-1 gap-3 rounded-lg border border-border p-4 sm:grid-cols-[1fr_1fr_auto] lg:col-span-2"
                                    >
                                        <TextField
                                            id={`taste_map_${index}_label`}
                                            label="Label"
                                            value={asString(item.label)}
                                            onChange={(value) =>
                                                setContent(['taste_map', index, 'label'], value)
                                            }
                                        />
                                        <TextField
                                            id={`taste_map_${index}_href`}
                                            label="Link"
                                            value={asString(item.href)}
                                            onChange={(value) =>
                                                setContent(['taste_map', index, 'href'], value)
                                            }
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="mt-6"
                                            onClick={() => {
                                                setContent(
                                                    ['taste_map'],
                                                    asList(content.taste_map).filter((_, current) => current !== index),
                                                );
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Remove link</span>
                                        </Button>
                                    </div>
                                );
                            })}
                            <div className="lg:col-span-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setContent(['taste_map'], [
                                            ...asList(content.taste_map),
                                            { label: '', href: '/menu' },
                                        ]);
                                    }}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add link
                                </Button>
                            </div>
                        </Section>

                        <Section title="Community Ledger">
                            <TextField
                                id="community_heading"
                                label="Heading"
                                value={asString(content.community_heading)}
                                onChange={(value) => setContent(['community_heading'], value)}
                                className="lg:col-span-2"
                            />
                            {asList(content.community).map((link, index) => {
                                const item = asRecord(link);

                                return (
                                    <div
                                        key={index}
                                        className="grid grid-cols-1 gap-3 rounded-lg border border-border p-4 sm:grid-cols-[1fr_1fr_auto] lg:col-span-2"
                                    >
                                        <TextField
                                            id={`community_${index}_label`}
                                            label="Label"
                                            value={asString(item.label)}
                                            onChange={(value) =>
                                                setContent(['community', index, 'label'], value)
                                            }
                                        />
                                        <TextField
                                            id={`community_${index}_href`}
                                            label="URL"
                                            value={asString(item.href)}
                                            onChange={(value) =>
                                                setContent(['community', index, 'href'], value)
                                            }
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="mt-6"
                                            onClick={() => {
                                                setContent(
                                                    ['community'],
                                                    asList(content.community).filter((_, current) => current !== index),
                                                );
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Remove link</span>
                                        </Button>
                                    </div>
                                );
                            })}
                            <div className="lg:col-span-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setContent(['community'], [
                                            ...asList(content.community),
                                            { label: '', href: '' },
                                        ]);
                                    }}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add link
                                </Button>
                            </div>
                        </Section>

                        <Section title="Bottom bar">
                            <TextField
                                id="footer_copyright"
                                label="Copyright"
                                value={asString(content.copyright)}
                                onChange={(value) => setContent(['copyright'], value)}
                                className="lg:col-span-2"
                            />
                            <p className="-mt-2 font-body text-xs text-muted-foreground lg:col-span-2">
                                Use {'{year}'} to insert the current year automatically.
                            </p>
                            {asList(content.nav).map((link, index) => {
                                const item = asRecord(link);

                                return (
                                    <div
                                        key={index}
                                        className="grid grid-cols-1 gap-3 rounded-lg border border-border p-4 sm:grid-cols-[1fr_1fr_auto] lg:col-span-2"
                                    >
                                        <TextField
                                            id={`footer_nav_${index}_label`}
                                            label="Label"
                                            value={asString(item.label)}
                                            onChange={(value) => setContent(['nav', index, 'label'], value)}
                                        />
                                        <TextField
                                            id={`footer_nav_${index}_href`}
                                            label="Link"
                                            value={asString(item.href)}
                                            onChange={(value) => setContent(['nav', index, 'href'], value)}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="mt-6"
                                            onClick={() => {
                                                setContent(
                                                    ['nav'],
                                                    asList(content.nav).filter((_, current) => current !== index),
                                                );
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Remove link</span>
                                        </Button>
                                    </div>
                                );
                            })}
                            <div className="lg:col-span-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setContent(['nav'], [...asList(content.nav), { label: '', href: '/' }]);
                                    }}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add link
                                </Button>
                            </div>
                        </Section>
                    </>
                )}

                <div className="flex gap-3">
                    <Button type="submit" disabled={processing} className="bg-primary text-primary-foreground hover:bg-primary/90">
                        {processing ? 'Saving…' : 'Save changes'}
                    </Button>
                </div>
            </form>
        </DashboardLayout>
    );
}
