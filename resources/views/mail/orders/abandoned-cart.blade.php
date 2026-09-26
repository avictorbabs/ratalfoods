<x-mail::message>
# Still hungry{{ $name ? ", {$name}" : '' }}?

You left these in your cart. We have saved them for you.

<x-mail::table>
| Item | Qty | Amount |
|:-----|:---:|-------:|
@foreach ($lines as $line)
| {{ $line['product_name'] }} | {{ $line['quantity'] }} | ${{ number_format($line['price'] * $line['quantity'], 2) }} |
@endforeach
</x-mail::table>

<x-mail::button :url="$url">
Complete your order
</x-mail::button>

If you already ordered, you can ignore this email.
</x-mail::message>
