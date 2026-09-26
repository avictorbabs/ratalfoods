@php
    $ratalFooterContent = \App\Models\PageContent::resolved('footer');
    $ratalLogoUrl = config('app.logo_url');
    $ratalPhone = $ratalFooterContent['phone'] ?? '226-348-7156';
@endphp
<x-mail::layout>
{{-- Header --}}
<x-slot:header>
<x-mail::header :url="config('app.url')">
@if ($ratalLogoUrl)
<img src="{{ $ratalLogoUrl }}" class="logo" alt="{{ config('app.name') }}">
@else
{{ config('app.name') }}
@endif
</x-mail::header>
</x-slot:header>

{{-- Body --}}
{!! $slot !!}

{{-- Subcopy --}}
@isset($subcopy)
<x-slot:subcopy>
<x-mail::subcopy>
{!! $subcopy !!}
</x-mail::subcopy>
</x-slot:subcopy>
@endisset

{{-- Footer --}}
<x-slot:footer>
<x-mail::footer>
**{{ config('app.name') }}**
Authentic Nigerian cuisine in Windsor, ON.
{{ $ratalPhone }} · [ratalfoods.ca]({{ config('app.url') }})

© {{ date('Y') }} {{ config('app.name') }}. {{ __('All rights reserved.') }}
</x-mail::footer>
</x-slot:footer>
</x-mail::layout>
