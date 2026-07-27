import { Head, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import OrdersPanel, { type AdminOrder } from '@/components/admin/orders-panel';
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
import type { StatusOption } from '@/lib/order-status';

type PaginatedOrders = {
    data: AdminOrder[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type OrdersIndexProps = {
    orders: PaginatedOrders;
    filters: {
        search: string;
        status: string;
    };
    statusOptions: StatusOption[];
};

const SEARCH_DEBOUNCE_MS = 300;

function filterParams(search: string, status: string) {
    return {
        search: search.trim() || undefined,
        status: status === 'all' ? undefined : status,
    };
}

export default function OrdersIndex({ orders, filters, statusOptions }: OrdersIndexProps) {
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status || 'all');
    const mounted = useRef(false);
    const skipEffects = useRef(false);
    const searchRef = useRef(search);
    const statusRef = useRef(status);

    searchRef.current = search;
    statusRef.current = status;

    const fetchOrders = (searchValue: string, statusValue: string) => {
        router.get('/admin/orders', filterParams(searchValue, statusValue), {
            preserveState: true,
            replace: true,
            preserveScroll: true,
        });
    };

    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
            return;
        }

        if (skipEffects.current) {
            return;
        }

        const serverStatus = filters.status || 'all';
        if (status === serverStatus) {
            return;
        }

        fetchOrders(searchRef.current, status);
    }, [status]);

    useEffect(() => {
        if (!mounted.current) {
            return;
        }

        if (skipEffects.current) {
            return;
        }

        const timer = window.setTimeout(() => {
            const serverSearch = filters.search ?? '';
            if (search.trim() === serverSearch.trim()) {
                return;
            }

            fetchOrders(searchRef.current, statusRef.current);
        }, SEARCH_DEBOUNCE_MS);

        return () => window.clearTimeout(timer);
    }, [search]);

    const clearFilters = () => {
        skipEffects.current = true;
        setSearch('');
        setStatus('all');
        router.get('/admin/orders', {}, {
            preserveState: true,
            replace: true,
            preserveScroll: true,
            onFinish: () => {
                skipEffects.current = false;
            },
        });
    };

    const hasActiveFilters = search.trim() !== '' || status !== 'all';

    return (
        <DashboardLayout variant="admin" title="Orders" subtitle="Manage and track all orders">
            <Head title="Orders — Admin" />

            <div className="mb-6 flex flex-col gap-3 rounded-xl border border-border bg-white p-4 shadow-sm sm:flex-row sm:items-end">
                <div className="flex-1">
                    <label
                        htmlFor="order-search"
                        className="mb-1.5 block font-body text-xs uppercase tracking-wider text-muted-foreground"
                    >
                        Search
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="order-search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Order ID, buyer, or product…"
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="w-full sm:w-48">
                    <label
                        htmlFor="order-status"
                        className="mb-1.5 block font-body text-xs uppercase tracking-wider text-muted-foreground"
                    >
                        Status
                    </label>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger id="order-status">
                            <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            {statusOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {hasActiveFilters && (
                    <Button type="button" variant="outline" onClick={clearFilters}>
                        Clear
                    </Button>
                )}
            </div>

            <OrdersPanel
                orders={orders.data}
                statusOptions={statusOptions}
                title={`All Orders (${orders.total})`}
                canDelete
            />

            {orders.last_page > 1 && (
                <div className="mt-4 flex items-center justify-between font-body text-sm">
                    <p className="text-muted-foreground">
                        Page {orders.current_page} of {orders.last_page}
                    </p>
                    <div className="flex gap-2">
                        {orders.links[0]?.url && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get(orders.links[0].url!)}
                            >
                                Previous
                            </Button>
                        )}
                        {orders.links[orders.links.length - 1]?.url && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    router.get(orders.links[orders.links.length - 1].url!)
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
