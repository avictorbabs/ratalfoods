import { BookingList, OrderList, type UserBooking, type UserOrder } from '@/components/dashboard/user-records';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/layouts/dashboard-layout';
import type { SharedData } from '@/types/ratalfoods';
import { Head, Link, usePage } from '@inertiajs/react';
import { Award, CalendarDays, ShoppingBag } from 'lucide-react';

type DashboardProps = {
    orders: UserOrder[];
    bookings: UserBooking[];
    orderCount: number;
    bookingCount: number;
};

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof ShoppingBag }) {
    return (
        <div className="border-border rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="bg-primary/15 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="font-body text-muted-foreground text-sm">{label}</p>
                    <p className="font-heading text-2xl">{value}</p>
                </div>
            </div>
        </div>
    );
}

function SectionHeader({
    title,
    total,
    shown,
    viewAllHref,
    actionLabel,
    actionHref,
}: {
    title: string;
    total: number;
    shown: number;
    viewAllHref: string;
    actionLabel: string;
    actionHref: string;
}) {
    return (
        <div className="border-border flex items-center justify-between border-b px-6 py-4">
            <h2 className="font-heading text-xl">{title}</h2>
            <div className="font-body flex items-center gap-4 text-sm">
                {total > shown && (
                    <Link href={viewAllHref} className="text-foreground font-medium hover:underline">
                        View all ({total})
                    </Link>
                )}
                <Button size="sm" asChild>
                    <Link href={actionHref}>{actionLabel}</Link>
                </Button>
            </div>
        </div>
    );
}

export default function Dashboard({ orders, bookings, orderCount, bookingCount }: DashboardProps) {
    const { auth, loyalty } = usePage<SharedData>().props;
    const firstName = auth.user?.name.split(' ')[0] ?? 'there';

    return (
        <DashboardLayout variant="user" title={`Welcome, ${firstName}`} subtitle="Manage your orders and bookings">
            <Head title="My Account" />

            <div className={`grid gap-4 sm:grid-cols-2 ${loyalty && loyalty.balance !== null ? 'lg:grid-cols-3' : ''}`}>
                <StatCard label="Total Orders" value={orderCount} icon={ShoppingBag} />
                <StatCard label="Total Bookings" value={bookingCount} icon={CalendarDays} />
                {loyalty && loyalty.balance !== null && (
                    <Link href="/dashboard/points" className="block transition hover:opacity-90">
                        <StatCard label="Loyalty points" value={loyalty.balance} icon={Award} />
                    </Link>
                )}
            </div>

            <section className="border-border mt-8 rounded-xl border bg-white shadow-sm">
                <SectionHeader
                    title="My Orders"
                    total={orderCount}
                    shown={orders.length}
                    viewAllHref="/dashboard/orders"
                    actionLabel="Order again"
                    actionHref="/menu"
                />
                <OrderList
                    orders={orders}
                    empty={
                        <>
                            <p className="font-body text-muted-foreground text-sm">No orders yet.</p>
                            <Link href="/menu" className="font-body text-primary mt-3 inline-block text-sm hover:underline">
                                Browse the menu
                            </Link>
                        </>
                    }
                />
            </section>

            <section className="border-border mt-8 rounded-xl border bg-white shadow-sm">
                <SectionHeader
                    title="My Bookings"
                    total={bookingCount}
                    shown={bookings.length}
                    viewAllHref="/dashboard/bookings"
                    actionLabel="New booking"
                    actionHref="/bookings"
                />
                <BookingList
                    bookings={bookings}
                    empty={
                        <>
                            <p className="font-body text-muted-foreground text-sm">No bookings yet.</p>
                            <Link href="/bookings" className="font-body text-primary mt-3 inline-block text-sm hover:underline">
                                Make a reservation
                            </Link>
                        </>
                    }
                />
            </section>
        </DashboardLayout>
    );
}
