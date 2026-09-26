<x-mail::message>
# Your repeat order is set

Hi {{ $order->customer_name }}, here is your {{ strtolower($recurring->frequencyLabel()) }} order. You pay when you {{ $order->collection_method === \App\Enums\CollectionMethod::Pickup ? 'pick it up' : 'receive it' }}.

<x-mail::panel>
**Order #:** {{ $order->order_number }}<br>
**Collection:** {{ $order->collectionLabel() }}<br>
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
| Tax | | ${{ number_format((float) $order->tax, 2) }} |
@if ((float) $order->delivery_fee > 0)
| Delivery{{ $order->delivery_zone ? " ({$order->delivery_zone})" : '' }} | | ${{ number_format((float) $order->delivery_fee, 2) }} |
@endif
| **Total** | | **${{ number_format((float) $order->total, 2) }}** |
</x-mail::table>

Not needing it this time? You can skip this one, and your schedule carries on as normal. Skipping works until the kitchen starts on your order.

<x-mail::button :url="$skipUrl">
Skip this order
</x-mail::button>

You can also pause or cancel your repeat orders any time from [your account]({{ $manageUrl }}).
</x-mail::message>
