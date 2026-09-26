<x-mail::message>
# We could not prepare your order

Hi {{ $recurring->customer_name }}, we were not able to set up your repeat order for **{{ $date->format('l, F j') }}**.

{{ $reason }}

Your repeat schedule is still active, so the next one will be tried on its usual day. You can review or change it any time.

<x-mail::button :url="$manageUrl">
Manage repeat orders
</x-mail::button>

We are sorry for the trouble.
</x-mail::message>
