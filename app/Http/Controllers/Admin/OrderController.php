<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateOrderStatusRequest;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $status = $request->query('status');

        $orders = Order::query()
            ->with('items')
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('order_number', 'like', "%{$search}%")
                        ->orWhere('customer_name', 'like', "%{$search}%")
                        ->orWhere('customer_email', 'like', "%{$search}%")
                        ->orWhereHas('items', fn ($items) => $items->where('product_name', 'like', "%{$search}%"));
                });
            })
            ->when(
                is_string($status) && $status !== '' && in_array($status, OrderStatus::values(), true),
                fn ($query) => $query->where('status', $status),
            )
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/Orders/Index', [
            'orders' => $orders,
            'filters' => [
                'search' => $search,
                'status' => is_string($status) ? $status : '',
            ],
            'statusOptions' => collect(OrderStatus::cases())->map(fn (OrderStatus $status) => [
                'value' => $status->value,
                'label' => $status->label(),
            ])->values(),
        ]);
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): RedirectResponse
    {
        $status = OrderStatus::from($request->validated('status'));

        $paymentStatus = match ($status) {
            OrderStatus::Pending => PaymentStatus::Unpaid,
            OrderStatus::Processing => PaymentStatus::Paid,
            OrderStatus::PaymentConfirmed,
            OrderStatus::Completed,
            OrderStatus::Delivered => PaymentStatus::Paid,
            OrderStatus::Refunded => PaymentStatus::Refunded,
            OrderStatus::Ready,
            OrderStatus::OutForDelivery,
            OrderStatus::Cancelled,
            OrderStatus::Disputed => $order->payment_status,
        };

        $order->update([
            'status' => $status,
            'payment_status' => $paymentStatus,
        ]);

        return back()->with('success', "Order {$order->order_number} updated to {$status->label()}.");
    }

    public function destroy(Order $order): RedirectResponse
    {
        $orderNumber = $order->order_number;
        $order->delete();

        return back()->with('success', "Order {$orderNumber} was deleted.");
    }
}
