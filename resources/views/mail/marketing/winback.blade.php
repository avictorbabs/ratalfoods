<x-mail::message>
# We miss you, {{ $firstName }}!

It has been a little while since your last order, and we would love to cook for you again.

<x-mail::panel>
**{{ $coupon->description() }} your next order**<br>
Your code: **{{ $coupon->code }}**<br>
@if ($coupon->expires_at)
Valid until {{ $coupon->expires_at->format('F j, Y') }}<br>
@endif
Use it with this email address at checkout. One use only.
</x-mail::panel>

<x-mail::button :url="route('menu.index')">
See what is on the menu
</x-mail::button>

<x-slot:subcopy>
You are receiving this because you have ordered from Ratal Foods. If you would rather not get offers like this, [unsubscribe here]({{ $unsubscribeUrl }}).
</x-slot:subcopy>
</x-mail::message>
