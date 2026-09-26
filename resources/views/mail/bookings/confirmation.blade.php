<x-mail::message>
# Booking received!

Hi {{ $booking->customer_name }}, thanks for booking with Ratal Foods. Your {{ strtolower($booking->typeLabel()) }} request has been received.

<x-mail::panel>
**Booking #:** {{ $booking->booking_number }}<br>
**Type:** {{ $booking->typeLabel() }}<br>
**Date:** {{ $booking->date->format('F j, Y') }}<br>
**Time:** {{ $booking->time }}<br>
@if ($booking->partySizeLine())
**{{ $booking->partySizeLine() }}**<br>
@endif
@if ($booking->occasion)
**Occasion:** {{ $booking->occasion }}<br>
@endif
</x-mail::panel>

@if ($booking->notes)
**Your notes:** {{ $booking->notes }}
@endif

We'll confirm shortly. If anything needs to change before then, just reply to this email or give us a call.

@if (\App\Support\GuestSignup::shouldInvite($booking->user_id, $booking->customer_email))
<x-mail::panel>
**Want to see all your bookings and orders in one place?** Create a free account with this email address. Your history will appear in your dashboard after you verify your email.
</x-mail::panel>

<x-mail::button :url="route('register')">
Create my account
</x-mail::button>
@endif

<x-mail::button :url="config('app.url')">
Visit Ratal Foods
</x-mail::button>
</x-mail::message>
