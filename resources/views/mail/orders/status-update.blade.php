<x-mail::message>
# {{ $headline }}

Hi {{ $order->customer_name }},

{{ $body }}

<x-mail::panel>
**Order #:** {{ $order->order_number }}<br>
**Collection:** {{ $order->collectionLabel() }}
</x-mail::panel>

@if ($showTracking && $order->tracking_url)
<x-mail::button :url="$order->tracking_url">
Track your order
</x-mail::button>
@endif
</x-mail::message>
