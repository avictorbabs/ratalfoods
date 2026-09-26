<x-mail::message>
@if ($kind === 'dispute')
# A customer disputed a payment

Stripe has opened a dispute (chargeback). **You must respond in your Stripe Dashboard before the deadline**, or the payment is lost.
@else
# {{ $details['full'] ? 'Order refunded' : 'Partial refund issued' }}

A refund was issued for this order in Stripe.{{ $details['full'] ? ' The order has been marked as refunded.' : '' }}
@endif

<x-mail::panel>
**Order #:** {{ $order->order_number }}<br>
**Customer:** {{ $order->customer_name }} ({{ $order->customer_email }})<br>
**Order total:** ${{ number_format((float) $order->total, 2) }}<br>
@if ($kind === 'dispute')
**Disputed amount:** ${{ number_format($details['amount'], 2) }} {{ $details['currency'] }}<br>
**Reason:** {{ str_replace('_', ' ', $details['reason']) }}
@else
**Refunded so far:** ${{ number_format($details['amount'], 2) }} {{ $details['currency'] }}
@endif
</x-mail::panel>

<x-mail::button :url="$adminUrl">
View orders
</x-mail::button>
</x-mail::message>
