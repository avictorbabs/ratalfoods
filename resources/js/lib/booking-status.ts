export type BookingStatusValue = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export const BOOKING_STATUS_LABELS: Record<BookingStatusValue, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    completed: 'Completed',
};

export const BOOKING_STATUS_STYLES: Record<BookingStatusValue, string> = {
    pending: 'bg-amber-100 text-amber-800',
    confirmed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-gray-100 text-gray-600',
    completed: 'bg-primary/15 text-primary',
};

export function formatBookingStatus(status: string): string {
    return BOOKING_STATUS_LABELS[status as BookingStatusValue] ?? status;
}

export function bookingStatusClass(status: string): string {
    return BOOKING_STATUS_STYLES[status as BookingStatusValue] ?? 'bg-muted text-muted-foreground';
}
