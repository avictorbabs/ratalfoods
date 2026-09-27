import type { CartItem } from '@/lib/cart-store';
export type Product = {
    id: number;
    name: string;
    description: string | null;
    price: string;
    category: string;
    category_id?: number | null;
    image_url: string | null;
    available_for_pickup: boolean;
    is_featured: boolean;
    preparation_time: string;
    serves: string | null;
    ingredients: string | null;
    is_active: boolean;
    in_stock: boolean;
    stock_quantity: number;
    sale_price?: string | null;
    sale_starts_at?: string | null;
    sale_ends_at?: string | null;
    gallery?: { type: 'image' | 'video'; url: string }[] | null;
    variations: ProductVariation[] | null;
    tags: string[] | null;
};

export type ProductReview = {
    id: number;
    customer_name: string;
    rating: number;
    comment: string;
    created_at: string;
};

export type ProductReviewStats = {
    count: number;
    average: number | null;
};

export type ProductVariationOption = {
    value: string;
    label: string;
    price_modifier: number;
};

export type ProductVariation = {
    name: string;
    options: ProductVariationOption[];
};

export type SearchProduct = Pick<Product, 'id' | 'name' | 'category' | 'price' | 'sale_price' | 'sale_starts_at' | 'sale_ends_at' | 'image_url'>;

export type ProductCategoryItem = {
    name: string;
    image_url: string | null;
};

export type BlogPost = {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    image_url: string | null;
    published_at: string | null;
    is_published: boolean;
};

export type StoreSettings = {
    id: number;
    store_name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    is_open: boolean;
    opening_hours: string | null;
    tax_rate: string;
    pickup_message: string;
};

export type User = {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'user';
    email_verified_at?: string | null;
};

export type OrderComplete = {
    order_number: string;
    subtotal: number;
    discount?: number;
    coupon_code?: string | null;
    tax: number;
    delivery_fee?: number;
    delivery_zone?: string | null;
    total: number;
    collection_method: 'pickup' | 'delivery_request';
    customer_name: string;
    customer_email: string;
    pickup_time?: string | null;
    payment_method?: 'cash_on_delivery' | 'stripe' | null;
    tracking_url?: string | null;
    guest_signup?: { has_account: boolean } | null;
};

export type DeliveryFeeZone = {
    id: number;
    name: string;
    match_terms: string;
    fee: string;
};

export type PageSlug = 'home' | 'about' | 'contact' | 'booking' | 'menu' | 'gallery' | 'footer' | 'faq' | 'privacy' | 'terms' | 'refund';

export type PageHeroContent = {
    image: string;
    eyebrow?: string;
    title: string;
    title_line_2?: string;
    body?: string;
    cta_primary_label?: string;
    cta_primary_href?: string;
    cta_secondary_label?: string;
    cta_secondary_href?: string;
};

export type HomePageContent = {
    hero: PageHeroContent;
    perks: { title: string; description: string }[];
    categories: { eyebrow: string; heading: string; link_label: string };
    featured: {
        eyebrow: string;
        heading: string;
        link_label: string;
        mobile_link_label: string;
    };
    why: {
        eyebrow: string;
        heading: string;
        slides: {
            title: string;
            description: string;
            image: string;
            image_alt: string;
            cta_label: string;
            cta_href: string;
        }[];
    };
    cta: {
        heading: string;
        body: string;
        primary_label: string;
        primary_href: string;
        secondary_label: string;
        secondary_href: string;
    };
    newsletter: {
        eyebrow: string;
        heading: string;
        body: string;
        button_label: string;
    };
    blog: { eyebrow: string; heading: string; link_label: string };
};

export type AboutPageContent = {
    hero: PageHeroContent;
    story: {
        image: string;
        heading: string;
        body: string;
        cta_label: string;
        cta_href: string;
    };
    history: { heading: string; body: string }[];
    culture: {
        heading: string;
        body: string;
        cta_label: string;
        cta_href: string;
        image: string;
    };
};

export type ContactPageContent = {
    hero: PageHeroContent;
    intro: { eyebrow: string; heading: string; body: string };
    location_label: string;
    location: string;
    phone_label: string;
    phone: string;
    email_label: string;
    email: string;
    whatsapp_url: string;
    whatsapp_label: string;
    map_heading: string;
};

export type BookingPageContent = {
    hero: PageHeroContent;
    types: { value: string; label: string; description: string }[];
    success: { heading: string; confirm_copy: string; cta_label: string };
};

export type MenuDetailSection = {
    title: string;
    description: string;
    items?: { name: string; description: string }[];
    body: string;
    cta_label: string;
    cta_category: string;
};

export type MenuPageContent = {
    hero: PageHeroContent;
    details_button_label: string;
    details: MenuDetailSection[];
    board_left_top: string;
    board_left_bottom: string;
    board_right: string;
};

export type GalleryPageContent = {
    hero: PageHeroContent;
    heading: string;
    featured: { title: string; description: string }[];
    showcase_1: string;
    showcase_2: string;
};

export type FooterLink = {
    label: string;
    href: string;
};

export type FooterPageContent = {
    brand_name: string;
    logo: string;
    tagline: string;
    phone: string;
    taste_map_heading: string;
    taste_map: FooterLink[];
    community_heading: string;
    community: FooterLink[];
    legal_heading: string;
    legal: FooterLink[];
    copyright: string;
    nav: FooterLink[];
};

export type SharedData = {
    name: string;
    auth: {
        user: User | null;
    };
    storeSettings: StoreSettings;
    footerContent: FooterPageContent;
    searchProducts: SearchProduct[];
    loyalty: { balance: number | null; points_per_dollar: number; point_value: number; min_redeem: number; max_percent: number } | null;
    welcomeOffer: { headline: string; body: string | null; delay_seconds: number; percent: number } | null;
    flash: {
        success?: string | null;
        error?: string | null;
        orderComplete?: OrderComplete | null;
        bookingNumber?: string | null;
        guestSignup?: { has_account: boolean } | null;
        recoveredCart?: { items: CartItem[]; email: string; unavailable: string[] } | null;
    };
};
