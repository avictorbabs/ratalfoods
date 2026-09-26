<x-mail::message>
# Welcome to Ratal Foods, {{ $name }}!

Thanks for joining our mailing list. Here is a little thank-you for your first order:

<x-mail::panel>
**{{ $coupon->description() }} your first order**<br>
Your code: **{{ $coupon->code }}**<br>
@if ($coupon->expires_at)
Valid until {{ $coupon->expires_at->format('F j, Y') }}<br>
@endif
@if ($coupon->min_order)
Minimum order ${{ number_format((float) $coupon->min_order, 2) }}<br>
@endif
Use it with this email address at checkout. One use only.
</x-mail::panel>

<x-mail::button :url="route('menu.index')">
Order now
</x-mail::button>
</x-mail::message>
