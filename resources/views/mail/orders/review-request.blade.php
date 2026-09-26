<x-mail::message>
# How did we do, {{ $order->customer_name }}?

We hope you enjoyed your order **#{{ $order->order_number }}**. Your feedback helps other customers choose and helps us keep improving.

@foreach ($products as $product)
<x-mail::button :url="route('menu.show', $product).'?review=1'">
Review {{ $product->name }}
</x-mail::button>

@endforeach
Thank you for supporting Ratal Foods!
</x-mail::message>
