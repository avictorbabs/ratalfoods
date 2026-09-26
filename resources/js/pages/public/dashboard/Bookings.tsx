import { Pagination, type Paginated } from '@/components/dashboard/pagination';
import { BookingList, type UserBooking } from '@/components/dashboard/user-records';
import DashboardLayout from '@/layouts/dashboard-layout';
import { Head, Link } from '@inertiajs/react';

export default function Bookings({ bookings }: { bookings: Paginated<UserBooking> }) {
    return (
        <DashboardLayout variant="user" title="My Bookings" subtitle="Your reservations and events">
            <Head title="My Bookings" />

            <section className="border-border rounded-xl border bg-white shadow-sm">
                <BookingList
                    bookings={bookings.data}
                    empty={
                        <>
                            <p className="font-body text-muted-foreground text-sm">No bookings yet.</p>
                            <Link href="/bookings" className="font-body text-primary mt-3 inline-block text-sm hover:underline">
                                Make a reservation
                            </Link>
                        </>
                    }
                />
                <Pagination page={bookings} />
            </section>
        </DashboardLayout>
    );
}
