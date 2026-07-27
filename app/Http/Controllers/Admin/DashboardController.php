<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Order;
use App\Models\Product;
use App\Models\StoreSetting;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $earningStatuses = [
            OrderStatus::Processing->value,
            OrderStatus::PaymentConfirmed->value,
            OrderStatus::Completed->value,
            OrderStatus::Delivered->value,
        ];

        return Inertia::render('admin/Dashboard', [
            'stats' => [
                'products' => Product::query()->count(),
                'orders' => Order::query()->count(),
                'bookings' => Booking::query()->count(),
                'earnings' => (float) Order::query()
                    ->whereIn('status', $earningStatuses)
                    ->sum('total'),
            ],
            'orders' => Order::query()->with('items')->latest()->limit(10)->get(),
            'statusOptions' => collect(OrderStatus::cases())->map(fn (OrderStatus $status) => [
                'value' => $status->value,
                'label' => $status->label(),
            ])->values(),
            'storeSettings' => StoreSetting::current(),
        ]);
    }
}
