import { Head, Link, usePage } from '@inertiajs/react';
import { CalendarDays, ShoppingBag } from 'lucide-react';
import DashboardLayout from '@/layouts/dashboard-layout';
import { formatPrice } from '@/lib/price';
import type { SharedData } from '@/types/ratalfoods';

type Order = {
    id: number;
    order_number: string;
    total: string;
    status: string;
    created_at: string;
};

type Booking = {
    id: number;
    booking_number: string;
    date: string;
    time: string;
    guests: number;
    status: string;
};

type DashboardProps = {
    orders: Order[];
    bookings: Booking[];
};

export default function Dashboard({ orders, bookings }: DashboardProps) {
    const { auth } = usePage<SharedData>().props;
    const firstName = auth.user?.name.split(' ')[0] ?? 'there';

    return (
        <DashboardLayout
            variant="user"
            title={`Welcome, ${firstName}`}
            subtitle="Manage your orders and bookings"
        >
            <Head title="My Account" />

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                            <ShoppingBag className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-body text-sm text-muted-foreground">Total Orders</p>
                            <p className="font-heading text-2xl">{orders.length}</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                            <CalendarDays className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-body text-sm text-muted-foreground">Total Bookings</p>
                            <p className="font-heading text-2xl">{bookings.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            <section id="orders" className="mt-8 rounded-xl border border-border bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <h2 className="font-heading text-xl">My Orders</h2>
                    <Link
                        href="/menu"
                        className="font-body text-sm text-primary hover:underline"
                    >
                        Order again
                    </Link>
                </div>
                {orders.length === 0 ? (
                    <div className="px-6 py-8">
                        <p className="font-body text-sm text-muted-foreground">No orders yet.</p>
                        <Link
                            href="/menu"
                            className="mt-3 inline-block font-body text-sm text-primary hover:underline"
                        >
                            Browse the menu
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div>
                                    <p className="font-body text-sm font-medium">{order.order_number}</p>
                                    <p className="font-body text-xs text-muted-foreground">
                                        {new Date(order.created_at).toLocaleDateString('en-CA', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="rounded-sm bg-muted px-2 py-1 font-body text-xs uppercase tracking-wider text-muted-foreground">
                                        {order.status}
                                    </span>
                                    <span className="font-body text-sm font-semibold text-primary">
                                        ${formatPrice(order.total)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section id="bookings" className="mt-8 rounded-xl border border-border bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <h2 className="font-heading text-xl">My Bookings</h2>
                    <Link
                        href="/bookings"
                        className="font-body text-sm text-primary hover:underline"
                    >
                        New booking
                    </Link>
                </div>
                {bookings.length === 0 ? (
                    <div className="px-6 py-8">
                        <p className="font-body text-sm text-muted-foreground">No bookings yet.</p>
                        <Link
                            href="/bookings"
                            className="mt-3 inline-block font-body text-sm text-primary hover:underline"
                        >
                            Make a reservation
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {bookings.map((booking) => (
                            <div
                                key={booking.id}
                                className="flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div>
                                    <p className="font-body text-sm font-medium">{booking.booking_number}</p>
                                    <p className="font-body text-xs text-muted-foreground">
                                        {booking.date} at {booking.time} · {booking.guests} guests
                                    </p>
                                </div>
                                <span className="rounded-sm bg-muted px-2 py-1 font-body text-xs uppercase tracking-wider text-muted-foreground">
                                    {booking.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </DashboardLayout>
    );
}
