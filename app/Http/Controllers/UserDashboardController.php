<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\LoyaltyTransaction;
use App\Models\Order;
use App\Models\StoreSetting;
use App\Support\CartLines;
use App\Support\Loyalty;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $orders = Order::query()->where('user_id', $user->id);
        $bookings = Booking::query()->where('user_id', $user->id);

        return Inertia::render('public/Dashboard', [
            'orders' => (clone $orders)->with('items')->latest()->limit(10)->get(),
            'bookings' => (clone $bookings)->latest()->limit(10)->get(),
            'orderCount' => $orders->count(),
            'bookingCount' => $bookings->count(),
        ]);
    }

    public function points(Request $request): Response
    {
        $user = $request->user();
        $settings = StoreSetting::current();

        return Inertia::render('public/dashboard/Points', [
            'enabled' => (bool) $settings->loyalty_enabled,
            'balance' => Loyalty::balance($user),
            'pointValue' => (float) $settings->loyalty_point_value,
            'pointsPerDollar' => (float) $settings->loyalty_points_per_dollar,
            'minRedeem' => (int) $settings->loyalty_min_redeem,
            'maxPercent' => (int) $settings->loyalty_max_percent,
            'expiryMonths' => $settings->loyalty_expiry_months,
            'nextExpiry' => LoyaltyTransaction::query()->where('user_id', $user->id)->spendable()
                ->whereNotNull('expires_at')->orderBy('expires_at')->first(['remaining', 'expires_at']),
            'transactions' => LoyaltyTransaction::query()
                ->where('user_id', $user->id)
                ->latest('id')
                ->paginate(15)
                ->through(fn (LoyaltyTransaction $transaction) => [
                    'id' => $transaction->id,
                    'label' => $transaction->label(),
                    'points' => $transaction->points,
                    'note' => $transaction->note,
                    'created_at' => $transaction->created_at->toIso8601String(),
                ]),
        ]);
    }

    public function orders(Request $request): Response
    {
        return Inertia::render('public/dashboard/Orders', [
            'orders' => Order::query()
                ->where('user_id', $request->user()->id)
                ->with('items')
                ->latest()
                ->paginate(15),
        ]);
    }

    /**
     * Current cart lines for a past order so the customer can order it again.
     * Prices and availability come from today's menu, not from the old order.
     */
    public function reorder(Request $request, Order $order): JsonResponse
    {
        abort_unless($order->user_id === $request->user()->id, 404);

        $resolved = CartLines::resolve(
            $order->items->map(fn ($item) => ['product_id' => $item->product_id, 'quantity' => $item->quantity])->all()
        );

        return response()->json([
            'items' => $resolved['lines'],
            'unavailable' => $resolved['unavailable'],
        ]);
    }

    public function bookings(Request $request): Response
    {
        return Inertia::render('public/dashboard/Bookings', [
            'bookings' => Booking::query()
                ->where('user_id', $request->user()->id)
                ->latest()
                ->paginate(15),
        ]);
    }
}
