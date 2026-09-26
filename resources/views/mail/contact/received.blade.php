<x-mail::message>
# {{ $isDelivery ? 'New delivery request' : 'New contact message' }}

<x-mail::panel>
**Name:** {{ $data['name'] }}<br>
**Email:** {{ $data['email'] }}<br>
**Phone:** {{ $data['phone'] ?? 'N/A' }}<br>
@if ($isDelivery)
**Address:** {{ $data['address'] ?? 'N/A' }}<br>
**Preferred time:** {{ $data['preferred_time'] ?? 'N/A' }}<br>
@endif
</x-mail::panel>

**Message:**

{{ $data['message'] }}

Reply to this email to respond directly to {{ $data['name'] }}.
</x-mail::message>
