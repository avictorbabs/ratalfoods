import { Head, router } from '@inertiajs/react';
import { Eye, Search, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import DashboardLayout from '@/layouts/dashboard-layout';
import {
    bookingStatusClass,
    formatBookingStatus,
    type BookingStatusValue,
} from '@/lib/booking-status';

type Booking = {
    id: number;
    booking_number: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string | null;
    date: string;
    time: string;
    guests: number;
    booking_type: string;
    occasion?: string | null;
    notes?: string | null;
    status: string;
    created_at: string;
};

type PaginatedBookings = {
    data: Booking[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type BookingsIndexProps = {
    bookings: PaginatedBookings;
    filters: {
        search: string;
        status: string;
    };
    statusOptions: { value: string; label: string }[];
};

const SEARCH_DEBOUNCE_MS = 300;

function filterParams(search: string, status: string) {
    return {
        search: search.trim() || undefined,
        status: status === 'all' ? undefined : status,
    };
}

function formatBookingType(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function BookingsIndex({ bookings, filters, statusOptions }: BookingsIndexProps) {
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status || 'all');
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [deleteBooking, setDeleteBooking] = useState<Booking | null>(null);
    const [bookingStatus, setBookingStatus] = useState<BookingStatusValue>('pending');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const mounted = useRef(false);
    const skipEffects = useRef(false);
    const searchRef = useRef(search);
    const statusRef = useRef(status);

    searchRef.current = search;
    statusRef.current = status;

    const fetchBookings = (searchValue: string, statusValue: string) => {
        router.get('/admin/bookings', filterParams(searchValue, statusValue), {
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

        fetchBookings(searchRef.current, status);
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

            fetchBookings(searchRef.current, statusRef.current);
        }, SEARCH_DEBOUNCE_MS);

        return () => window.clearTimeout(timer);
    }, [search]);

    const clearFilters = () => {
        skipEffects.current = true;
        setSearch('');
        setStatus('all');
        router.get('/admin/bookings', {}, {
            preserveState: true,
            replace: true,
            preserveScroll: true,
            onFinish: () => {
                skipEffects.current = false;
            },
        });
    };

    const hasActiveFilters = search.trim() !== '' || status !== 'all';

    const openBooking = (booking: Booking) => {
        setSelectedBooking(booking);
        setBookingStatus(booking.status as BookingStatusValue);
    };

    const closeBookingModal = () => {
        setSelectedBooking(null);
        setSaving(false);
    };

    const saveBookingStatus = () => {
        if (!selectedBooking) {
            return;
        }

        setSaving(true);
        router.patch(
            `/admin/bookings/${selectedBooking.id}`,
            { status: bookingStatus },
            {
                preserveScroll: true,
                onFinish: () => setSaving(false),
                onSuccess: closeBookingModal,
            },
        );
    };

    const confirmDeleteBooking = () => {
        if (!deleteBooking) {
            return;
        }

        setDeleting(true);
        router.delete(`/admin/bookings/${deleteBooking.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteBooking(null);
            },
        });
    };

    return (
        <DashboardLayout variant="admin" title="Bookings" subtitle="Manage table reservations and events">
            <Head title="Bookings — Admin" />

            <div className="mb-6 flex flex-col gap-3 rounded-xl border border-border bg-white p-4 shadow-sm sm:flex-row sm:items-end">
                <div className="flex-1">
                    <label
                        htmlFor="booking-search"
                        className="mb-1.5 block font-body text-xs uppercase tracking-wider text-muted-foreground"
                    >
                        Search
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="booking-search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Booking ID, guest name, or email…"
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="w-full sm:w-48">
                    <label
                        htmlFor="booking-status"
                        className="mb-1.5 block font-body text-xs uppercase tracking-wider text-muted-foreground"
                    >
                        Status
                    </label>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger id="booking-status">
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

            <section className="rounded-xl border border-border bg-white shadow-sm">
                <div className="border-b border-border px-6 py-4">
                    <h2 className="font-heading text-xl">All Bookings ({bookings.total})</h2>
                </div>

                {bookings.data.length === 0 ? (
                    <p className="px-6 py-8 font-body text-sm text-muted-foreground">
                        No bookings match your filters.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    <th className="px-6 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Booking ID
                                    </th>
                                    <th className="px-6 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Guest
                                    </th>
                                    <th className="px-6 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Date & Time
                                    </th>
                                    <th className="px-6 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Guests
                                    </th>
                                    <th className="px-6 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {bookings.data.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-muted/20">
                                        <td className="px-6 py-4 font-body text-sm font-medium">
                                            {booking.booking_number}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-body text-sm">{booking.customer_name}</p>
                                            <p className="font-body text-xs text-muted-foreground">
                                                {booking.customer_email}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 font-body text-sm text-muted-foreground">
                                            {new Date(booking.date).toLocaleDateString()} at {booking.time}
                                        </td>
                                        <td className="px-6 py-4 font-body text-sm">{booking.guests}</td>
                                        <td className="px-6 py-4 font-body text-xs uppercase tracking-wider text-muted-foreground">
                                            {formatBookingType(booking.booking_type)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex rounded-sm px-2 py-1 font-body text-xs font-medium uppercase tracking-wider ${bookingStatusClass(booking.status)}`}
                                            >
                                                {formatBookingStatus(booking.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openBooking(booking)}
                                                    aria-label={`View booking ${booking.booking_number}`}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeleteBooking(booking)}
                                                    className="text-destructive hover:text-destructive"
                                                    aria-label={`Delete booking ${booking.booking_number}`}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {bookings.last_page > 1 && (
                <div className="mt-4 flex items-center justify-between font-body text-sm">
                    <p className="text-muted-foreground">
                        Page {bookings.current_page} of {bookings.last_page}
                    </p>
                    <div className="flex gap-2">
                        {bookings.links[0]?.url && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get(bookings.links[0].url!)}
                            >
                                Previous
                            </Button>
                        )}
                        {bookings.links[bookings.links.length - 1]?.url && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    router.get(bookings.links[bookings.links.length - 1].url!)
                                }
                            >
                                Next
                            </Button>
                        )}
                    </div>
                </div>
            )}

            <Dialog
                open={selectedBooking !== null}
                onOpenChange={(open) => !open && closeBookingModal()}
            >
                <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
                    {selectedBooking && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="font-heading">
                                    Booking {selectedBooking.booking_number}
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4 font-body text-sm">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                            Guest Name
                                        </p>
                                        <p className="font-medium">{selectedBooking.customer_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                            Created
                                        </p>
                                        <p>{new Date(selectedBooking.created_at).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                            Email
                                        </p>
                                        <p>{selectedBooking.customer_email}</p>
                                    </div>
                                    {selectedBooking.customer_phone && (
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                                Phone
                                            </p>
                                            <p>{selectedBooking.customer_phone}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                            Date & Time
                                        </p>
                                        <p>
                                            {new Date(selectedBooking.date).toLocaleDateString()} at{' '}
                                            {selectedBooking.time}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                            Guests
                                        </p>
                                        <p>{selectedBooking.guests}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                            Type
                                        </p>
                                        <p>{formatBookingType(selectedBooking.booking_type)}</p>
                                    </div>
                                    {selectedBooking.occasion && (
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                                Occasion
                                            </p>
                                            <p>{selectedBooking.occasion}</p>
                                        </div>
                                    )}
                                </div>

                                {selectedBooking.notes && (
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                            Notes
                                        </p>
                                        <p className="mt-1 text-muted-foreground">
                                            {selectedBooking.notes}
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                                        Update Status
                                    </p>
                                    <Select
                                        value={bookingStatus}
                                        onValueChange={(value) =>
                                            setBookingStatus(value as BookingStatusValue)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statusOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={closeBookingModal}>
                                    Cancel
                                </Button>
                                <Button onClick={saveBookingStatus} disabled={saving}>
                                    {saving ? 'Saving…' : 'Save Status'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={deleteBooking !== null}
                onOpenChange={(open) => !open && !deleting && setDeleteBooking(null)}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-heading">Delete booking?</DialogTitle>
                        <DialogDescription className="font-body">
                            {deleteBooking && (
                                <>
                                    You are about to permanently delete{' '}
                                    <span className="font-medium text-foreground">
                                        {deleteBooking.booking_number}
                                    </span>
                                    . This action cannot be undone.
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteBooking(null)}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDeleteBooking}
                            disabled={deleting}
                        >
                            {deleting ? 'Deleting…' : 'Delete Booking'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
