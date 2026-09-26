<x-mail::message>
# New order received

**{{ $order->order_number }}** — ${{ number_format((float) $order->total, 2) }}

<x-mail::panel>
**Customer:** {{ $order->customer_name }}<br>
**Email:** {{ $order->customer_email }}<br>
**Phone:** {{ $order->customer_phone ?: '—' }}<br>
**Method:** {{ $order->collectionLabel() }}<br>
@if ($order->delivery_address)
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

**Notes:** {{ $order->notes ?: 'None' }}

<x-mail::button :url="$adminUrl">
View orders
</x-mail::button>

Reply to this email to contact the customer directly.
</x-mail::message>
