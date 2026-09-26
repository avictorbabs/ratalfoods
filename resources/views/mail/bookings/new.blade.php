<x-mail::message>
# New booking received

**{{ $booking->booking_number }}** — {{ $booking->typeLabel() }}

<x-mail::panel>
**Customer:** {{ $booking->customer_name }}<br>
**Email:** {{ $booking->customer_email }}<br>
**Phone:** {{ $booking->customer_phone ?: '—' }}<br>
**Date:** {{ $booking->date->format('F j, Y') }}<br>
**Time:** {{ $booking->time }}<br>
@if ($booking->partySizeLine())
**{{ $booking->partySizeLine() }}**<br>
@endif
@if ($booking->occasion)
**Occasion:** {{ $booking->occasion }}<br>
@endif
</x-mail::panel>

**Notes:** {{ $booking->notes ?: 'None' }}

<x-mail::button :url="$adminUrl">
View bookings
</x-mail::button>

Reply to this email to contact the customer directly.
</x-mail::message>
