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

export type ProductVariationOption = {
    value: string;
    label: string;
    price_modifier: number;
};

export type ProductVariation = {
    name: string;
    options: ProductVariationOption[];
};

export type SearchProduct = Pick<
    Product,
    'id' | 'name' | 'category' | 'price' | 'sale_price' | 'sale_starts_at' | 'sale_ends_at' | 'image_url'
>;

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
};

export type OrderComplete = {
    order_number: string;
    subtotal: number;
    tax: number;
    total: number;
    collection_method: 'pickup' | 'delivery_request';
    customer_name: string;
    customer_email: string;
};

export type SharedData = {
    name: string;
    auth: {
        user: User | null;
    };
    storeSettings: StoreSettings;
    searchProducts: SearchProduct[];
    flash: {
        success?: string | null;
        error?: string | null;
        orderComplete?: OrderComplete | null;
        bookingNumber?: string | null;
    };
};
