<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\StoreSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CouponController extends Controller
{
    public function index(): Response
    {
        $coupons = Coupon::query()
            ->whereNull('campaign')
            ->latest()
            ->get()
            ->map(fn (Coupon $coupon) => [
                ...$coupon->toArray(),
                'times_used' => $coupon->timesUsed(),
            ]);

        $welcome = Coupon::query()->where('campaign', 'welcome');
        $winback = Coupon::query()->where('campaign', 'winback');

        return Inertia::render('admin/Coupons/Index', [
            'coupons' => $coupons,
            'welcomeStats' => [
                'issued' => (clone $welcome)->count(),
                'redeemed' => (clone $welcome)->get()->filter(fn (Coupon $coupon) => $coupon->timesUsed() > 0)->count(),
            ],
            'winbackStats' => [
                'sent' => (clone $winback)->count(),
                'redeemed' => (clone $winback)->get()->filter(fn (Coupon $coupon) => $coupon->timesUsed() > 0)->count(),
            ],
            'winback' => StoreSetting::current()->only([
                'winback_enabled', 'winback_days_inactive', 'winback_discount_percent', 'winback_valid_days',
            ]),
            'welcome' => StoreSetting::current()->only([
                'welcome_offer_enabled', 'welcome_discount_percent', 'welcome_max_discount', 'welcome_min_order',
                'welcome_valid_days', 'welcome_delay_seconds', 'welcome_headline', 'welcome_body',
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Coupon::query()->create($this->validated($request));

        return back()->with('success', 'Coupon created.');
    }

    public function update(Request $request, Coupon $coupon): RedirectResponse
    {
        $coupon->update($this->validated($request, $coupon));

        return back()->with('success', 'Coupon updated.');
    }

    public function destroy(Coupon $coupon): RedirectResponse
    {
        $coupon->delete();

        return back()->with('success', 'Coupon deleted.');
    }

    public function updateWelcome(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'welcome_offer_enabled' => ['required', 'boolean'],
            'welcome_discount_percent' => ['required', 'numeric', 'min:1', 'max:100'],
            'welcome_max_discount' => ['nullable', 'numeric', 'min:0'],
            'welcome_min_order' => ['nullable', 'numeric', 'min:0'],
            'welcome_valid_days' => ['required', 'integer', 'min:1', 'max:365'],
            'welcome_delay_seconds' => ['required', 'integer', 'min:0', 'max:300'],
            'welcome_headline' => ['required', 'string', 'max:120'],
            'welcome_body' => ['nullable', 'string', 'max:500'],
        ]);

        StoreSetting::current()->update($data);

        return back()->with('success', 'Welcome offer saved.');
    }

    public function updateWinback(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'winback_enabled' => ['required', 'boolean'],
            'winback_days_inactive' => ['required', 'integer', 'min:7', 'max:365'],
            'winback_discount_percent' => ['required', 'numeric', 'min:1', 'max:100'],
            'winback_valid_days' => ['required', 'integer', 'min:1', 'max:365'],
        ]);

        StoreSetting::current()->update($data);

        return back()->with('success', 'Win-back offer saved.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Coupon $coupon = null): array
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:64', 'alpha_dash', Rule::unique('coupons', 'code')->ignore($coupon?->id)],
            'type' => ['required', Rule::in([Coupon::TYPE_PERCENT, Coupon::TYPE_FIXED])],
            'value' => ['required', 'numeric', 'min:0.01', $request->input('type') === Coupon::TYPE_PERCENT ? 'max:100' : 'max:10000'],
            'min_order' => ['nullable', 'numeric', 'min:0'],
            'max_discount' => ['nullable', 'numeric', 'min:0'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'first_order_only' => ['required', 'boolean'],
            'is_active' => ['required', 'boolean'],
        ]);

        $data['code'] = Coupon::normalize($data['code']);

        return $data;
    }
}
