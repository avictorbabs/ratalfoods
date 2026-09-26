<?php

namespace App\Http\Controllers;

use App\Enums\CollectionMethod;
use App\Models\Order;
use App\Models\StoreSetting;
use App\Support\OrderTimeline;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class OrderTrackingController extends Controller
{
    public function __invoke(string $token): Response|RedirectResponse
    {
        $order = Order::query()->where('tracking_token', $token)->with('items')->first();

        if (! $order) {
            return redirect()->route('home')->with('error', 'We could not find that order. Please check the link in your email.');
        }

        return Inertia::render('public/OrderTracking', [
            'order' => [
                'order_number' => $order->order_number,
                'status' => $order->status->value,
                'status_label' => $order->status->label(),
                'customer_name' => $order->customer_name,
                'collection_method' => $order->collection_method->value,
                'collection_label' => $order->collectionLabel(),
                'delivery_address' => $order->collection_method === CollectionMethod::DeliveryRequest ? $order->delivery_address : null,
                'pickup_address' => $order->collection_method === CollectionMethod::Pickup ? StoreSetting::current()->address : null,
                'placed_at' => $order->created_at->toIso8601String(),
                'subtotal' => (float) $order->subtotal,
                'discount' => (float) $order->discount,
                'loyalty_discount' => (float) $order->loyalty_discount,
                'tax' => (float) $order->tax,
                'delivery_fee' => (float) $order->delivery_fee,
                'total' => (float) $order->total,
                'items' => $order->items->map(fn ($item) => [
                    'name' => $item->product_name,
                    'quantity' => $item->quantity,
                    'price' => (float) $item->price,
                ])->values(),
            ],
            'timeline' => OrderTimeline::for($order),
        ]);
    }
}
