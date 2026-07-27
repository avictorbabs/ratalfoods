<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $orders = Order::query()
            ->with('items')
            ->when(
                $user,
                fn ($query) => $query->where('user_id', $user->id),
                fn ($query) => $query->whereRaw('1 = 0')
            )
            ->latest()
            ->limit(20)
            ->get();

        $bookings = Booking::query()
            ->when(
                $user,
                fn ($query) => $query->where('user_id', $user->id),
                fn ($query) => $query->whereRaw('1 = 0')
            )
            ->latest()
            ->limit(20)
            ->get();

        return Inertia::render('public/Dashboard', [
            'orders' => $orders,
            'bookings' => $bookings,
        ]);
    }
}
