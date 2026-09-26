import { Pagination, type Paginated } from '@/components/dashboard/pagination';
import { OrderList, type UserOrder } from '@/components/dashboard/user-records';
import DashboardLayout from '@/layouts/dashboard-layout';
import { Head, Link } from '@inertiajs/react';

export default function Orders({ orders }: { orders: Paginated<UserOrder> }) {
    return (
        <DashboardLayout variant="user" title="My Orders" subtitle="Everything you've ordered from Ratal Foods">
            <Head title="My Orders" />

            <section className="border-border rounded-xl border bg-white shadow-sm">
                <OrderList
                    orders={orders.data}
                    empty={
                        <>
                            <p className="font-body text-muted-foreground text-sm">No orders yet.</p>
                            <Link href="/menu" className="font-body text-primary mt-3 inline-block text-sm hover:underline">
                                Browse the menu
                            </Link>
                        </>
                    }
                />
                <Pagination page={orders} />
            </section>
        </DashboardLayout>
    );
}
