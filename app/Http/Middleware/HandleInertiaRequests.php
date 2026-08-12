<?php

namespace App\Http\Middleware;

use App\Models\PageContent;
use App\Models\Product;
use App\Models\StoreSetting;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user()
                    ? [
                        'id' => $request->user()->id,
                        'name' => $request->user()->name,
                        'email' => $request->user()->email,
                        'role' => $request->user()->role?->value ?? 'user',
                        'email_verified_at' => $request->user()->email_verified_at,
                    ]
                    : null,
            ],
            'storeSettings' => fn () => StoreSetting::current(),
            'footerContent' => fn () => PageContent::resolved('footer'),
            'searchProducts' => fn () => Product::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'category', 'price', 'sale_price', 'sale_starts_at', 'sale_ends_at', 'image_url']),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'orderComplete' => fn () => $request->session()->get('orderComplete'),
                'bookingNumber' => fn () => $request->session()->get('bookingNumber'),
            ],
        ];
    }
}
