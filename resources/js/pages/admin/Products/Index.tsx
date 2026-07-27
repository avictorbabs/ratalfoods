import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ProductsTable, { type AdminProduct } from '@/components/admin/products-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import DashboardLayout from '@/layouts/dashboard-layout';

type PaginatedProducts = {
    data: AdminProduct[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type ProductsIndexProps = {
    products: PaginatedProducts;
    filters: {
        search: string;
        category: string;
        stock: string;
    };
    categoryOptions: { value: string; label: string }[];
};

const SEARCH_DEBOUNCE_MS = 300;

function filterParams(search: string, category: string, stock: string) {
    return {
        search: search.trim() || undefined,
        category: category === 'all' ? undefined : category,
        stock: stock === 'all' ? undefined : stock,
    };
}

export default function ProductsIndex({ products, filters, categoryOptions }: ProductsIndexProps) {
    const [search, setSearch] = useState(filters.search);
    const [category, setCategory] = useState(filters.category || 'all');
    const [stock, setStock] = useState(filters.stock || 'all');
    const mounted = useRef(false);
    const skipEffects = useRef(false);
    const searchRef = useRef(search);
    const categoryRef = useRef(category);
    const stockRef = useRef(stock);

    searchRef.current = search;
    categoryRef.current = category;
    stockRef.current = stock;

    const fetchProducts = (searchValue: string, categoryValue: string, stockValue: string) => {
        router.get('/admin/products', filterParams(searchValue, categoryValue, stockValue), {
            preserveState: true,
            replace: true,
            preserveScroll: true,
        });
    };

    const filtersMatchServer = () =>
        search.trim() === (filters.search ?? '').trim() &&
        category === (filters.category || 'all') &&
        stock === (filters.stock || 'all');

    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
            return;
        }

        if (skipEffects.current || filtersMatchServer()) {
            return;
        }

        fetchProducts(searchRef.current, category, stock);
    }, [category, stock]);

    useEffect(() => {
        if (!mounted.current) {
            return;
        }

        if (skipEffects.current) {
            return;
        }

        const timer = window.setTimeout(() => {
            if (search.trim() === (filters.search ?? '').trim()) {
                return;
            }

            fetchProducts(searchRef.current, categoryRef.current, stockRef.current);
        }, SEARCH_DEBOUNCE_MS);

        return () => window.clearTimeout(timer);
    }, [search]);

    const clearFilters = () => {
        skipEffects.current = true;
        setSearch('');
        setCategory('all');
        setStock('all');
        router.get('/admin/products', {}, {
            preserveState: true,
            replace: true,
            preserveScroll: true,
            onFinish: () => {
                skipEffects.current = false;
            },
        });
    };

    const hasActiveFilters = search.trim() !== '' || category !== 'all' || stock !== 'all';

    return (
        <DashboardLayout variant="admin" title="Products" subtitle="Manage your menu items">
            <Head title="Products — Admin" />

            <div className="mb-6 flex flex-col gap-3 rounded-xl border border-border bg-white p-4 shadow-sm lg:flex-row lg:items-end">
                <div className="flex-1">
                    <label
                        htmlFor="product-search"
                        className="mb-1.5 block font-body text-xs uppercase tracking-wider text-muted-foreground"
                    >
                        Search
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="product-search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Product name or description…"
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="w-full sm:w-52">
                    <label
                        htmlFor="product-category"
                        className="mb-1.5 block font-body text-xs uppercase tracking-wider text-muted-foreground"
                    >
                        Category
                    </label>
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger id="product-category">
                            <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All categories</SelectItem>
                            {categoryOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-full sm:w-44">
                    <label
                        htmlFor="product-stock"
                        className="mb-1.5 block font-body text-xs uppercase tracking-wider text-muted-foreground"
                    >
                        Availability
                    </label>
                    <Select value={stock} onValueChange={setStock}>
                        <SelectTrigger id="product-stock">
                            <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="in_stock">In stock</SelectItem>
                            <SelectItem value="out_of_stock">Out of stock</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {hasActiveFilters && (
                    <Button type="button" variant="outline" onClick={clearFilters}>
                        Clear
                    </Button>
                )}
            </div>

            <section className="rounded-xl border border-border bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="font-heading text-xl">All Products ({products.total})</h2>
                    <Button asChild>
                        <Link href="/admin/products/create">
                            <Plus className="h-4 w-4" />
                            Add New Product
                        </Link>
                    </Button>
                </div>

                {products.data.length === 0 ? (
                    <div className="px-6 py-8">
                        <p className="font-body text-sm text-muted-foreground">
                            No products match your filters.
                        </p>
                        <Button className="mt-4" asChild>
                            <Link href="/admin/products/create">
                                <Plus className="h-4 w-4" />
                                Add New Product
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <ProductsTable products={products.data} />
                )}
            </section>

            {products.last_page > 1 && (
                <div className="mt-4 flex items-center justify-between font-body text-sm">
                    <p className="text-muted-foreground">
                        Page {products.current_page} of {products.last_page}
                    </p>
                    <div className="flex gap-2">
                        {products.links[0]?.url && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get(products.links[0].url!)}
                            >
                                Previous
                            </Button>
                        )}
                        {products.links[products.links.length - 1]?.url && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    router.get(products.links[products.links.length - 1].url!)
                                }
                            >
                                Next
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
