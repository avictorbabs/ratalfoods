<x-mail::message>
# Thank you for your order!

Hi {{ $order->customer_name }}, we've received your order and are getting it ready.

<x-mail::panel>
**Order #:** {{ $order->order_number }}<br>
**Collection:** {{ $order->collectionLabel() }}<br>
@if ($order->collection_method === \App\Enums\CollectionMethod::Pickup)
**Pickup location:** {{ $store->address }}<br>
@elseif ($order->delivery_address)
**Delivery address:** {{ $order->delivery_address }}<br>
@endif
**Payment:** {{ $order->paymentLabel() }}
</x-mail::panel>

<x-mail::table>
| Item | Qty | Amount |
|:-----|:---:|-------:|
@foreach ($order->items as $item)
| {{ $item->product_name }} | {{ $item->quantity }} | ${{ number_format((float) $item->price * $item->quantity, 2) }} |
@endforeach
| Subtotal | | ${{ number_format((float) $order->subtotal, 2) }} |
@if ((float) $order->loyalty_discount > 0)
| Points ({{ number_format($order->loyalty_points_redeemed) }}) | | -${{ number_format((float) $order->loyalty_discount, 2) }} |
@endif
@if ((float) $order->discount > 0)
| Discount{{ $order->coupon_code ? " ({$order->coupon_code})" : '' }} | | -${{ number_format((float) $order->discount, 2) }} |
@endif
| Tax | | ${{ number_format((float) $order->tax, 2) }} |
@if ((float) $order->delivery_fee > 0)
| Delivery{{ $order->delivery_zone ? " ({$order->delivery_zone})" : '' }} | | ${{ number_format((float) $order->delivery_fee, 2) }} |
@endif
| **Total** | | **${{ number_format((float) $order->total, 2) }}** |
</x-mail::table>

@if ($order->notes)
**Your notes:** {{ $order->notes }}
@endif

Please keep this email for your records. We may call you if we need to clarify anything.

@if (\App\Support\GuestSignup::shouldInvite($order->user_id, $order->customer_email))
<x-mail::panel>
**Want to track this order and reorder in one click?** Create a free account with this email address. Your orders and bookings will appear in your dashboard after you verify your email.
</x-mail::panel>

<x-mail::button :url="route('register')">
Create my account
</x-mail::button>
@endif

<x-mail::button :url="$order->tracking_url ?? config('app.url')">
Track your order
</x-mail::button>
</x-mail::message>
