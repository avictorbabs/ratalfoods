<?php

namespace App\Http\Middleware;

use App\Models\Coupon;
use App\Models\PageContent;
use App\Models\Product;
use App\Models\StoreSetting;
use App\Support\Loyalty;
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
            'recaptchaSiteKey' => config('services.recaptcha.site_key'),
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
            'storeSettings' => fn () => StoreSetting::current()->only([
                'id', 'store_name', 'phone', 'email', 'address', 'is_open', 'opening_hours', 'tax_rate', 'pickup_message',
            ]),
            'loyalty' => function () use ($request) {
                $settings = StoreSetting::current();

                if (! $settings->loyalty_enabled) {
                    return null;
                }

                $user = $request->user();

                return [
                    // null for guests and unverified accounts: they cannot spend points yet.
                    'balance' => $user && $user->hasVerifiedEmail() ? Loyalty::balance($user) : null,
                    'points_per_dollar' => (float) $settings->loyalty_points_per_dollar,
                    'point_value' => (float) $settings->loyalty_point_value,
                    'min_redeem' => (int) $settings->loyalty_min_redeem,
                    'max_percent' => (int) $settings->loyalty_max_percent,
                ];
            },
            'welcomeOffer' => function () use ($request) {
                $settings = StoreSetting::current();
                $user = $request->user();

                // Only for visitors who could still make a first order.
                if (! $settings->welcome_offer_enabled || $user?->isAdmin()) {
                    return null;
                }

                if ($user && Coupon::hasPreviousOrder($user->email, $user->id)) {
                    return null;
                }

                return [
                    'headline' => $settings->welcome_headline,
                    'body' => $settings->welcome_body,
                    'delay_seconds' => (int) $settings->welcome_delay_seconds,
                    'percent' => (float) $settings->welcome_discount_percent,
                ];
            },
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
                'recoveredCart' => fn () => $request->session()->get('recoveredCart'),
                'guestSignup' => fn () => $request->session()->get('guestSignup'),
            ],
        ];
    }
}
