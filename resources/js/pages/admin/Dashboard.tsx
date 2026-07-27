import { Head } from '@inertiajs/react';
import { CalendarDays, DollarSign, Package, ShoppingBag } from 'lucide-react';
import OrdersPanel from '@/components/admin/orders-panel';
import DashboardLayout from '@/layouts/dashboard-layout';
import { formatPrice } from '@/lib/price';
import type { AdminOrder } from '@/components/admin/orders-panel';
import type { StatusOption } from '@/lib/order-status';

type AdminDashboardProps = {
    stats: {
        products: number;
        orders: number;
        bookings: number;
        earnings: number;
    };
    orders: AdminOrder[];
    statusOptions: StatusOption[];
};

function StatCard({
    label,
    value,
    icon: Icon,
    formatted,
}: {
    label: string;
    value: number | string;
    icon: typeof Package;
    formatted?: boolean;
}) {
    return (
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <p className="font-body text-sm text-muted-foreground">{label}</p>
                    <p className="mt-2 font-heading text-3xl text-foreground">
                        {formatted ? `$${formatPrice(String(value))}` : value}
                    </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

export default function AdminDashboard({ stats, orders, statusOptions }: AdminDashboardProps) {
    return (
        <DashboardLayout
            variant="admin"
            title="Welcome back"
            subtitle="Your store overview"
        >
            <Head title="Admin Dashboard" />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Products" value={stats.products} icon={Package} />
                <StatCard label="Orders" value={stats.orders} icon={ShoppingBag} />
                <StatCard label="Bookings" value={stats.bookings} icon={CalendarDays} />
                <StatCard
                    label="Earnings"
                    value={stats.earnings}
                    icon={DollarSign}
                    formatted
                />
            </div>

            <div className="mt-8">
                <OrdersPanel
                    orders={orders}
                    statusOptions={statusOptions}
                    showViewAll
                />
            </div>
        </DashboardLayout>
    );
}
