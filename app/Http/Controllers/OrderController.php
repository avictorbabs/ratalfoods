<?php

namespace App\Http\Controllers;

use App\Enums\CollectionMethod;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Requests\StoreOrderRequest;
use App\Models\Order;
use App\Models\Product;
use App\Models\StoreSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class OrderController extends Controller
{
    public function store(StoreOrderRequest $request): RedirectResponse
    {
        $settings = StoreSetting::current();
        $productIds = collect($request->validated('items'))->pluck('product_id')->unique();
        $products = Product::query()
            ->whereIn('id', $productIds)
            ->where('is_active', true)
            ->get()
            ->keyBy('id');

        if ($products->count() !== $productIds->count()) {
            return back()->withErrors(['items' => 'One or more products are no longer available.']);
        }

        $method = CollectionMethod::from($request->validated('collection_method'));

        $order = DB::transaction(function () use ($request, $settings, $products, $method) {
            $subtotal = 0;
            $lineItems = [];

            foreach ($request->validated('items') as $item) {
                $product = $products[$item['product_id']];
                $unitPrice = $product->effectivePrice();
                $lineTotal = $unitPrice * (int) $item['quantity'];
                $subtotal += $lineTotal;

                $lineItems[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity' => (int) $item['quantity'],
                    'price' => $unitPrice,
                ];
            }

            $tax = round($subtotal * ((float) $settings->tax_rate / 100), 2);
            $total = round($subtotal + $tax, 2);

            $order = Order::query()->create([
                'user_id' => $request->user()?->id,
                'customer_name' => $request->validated('customer_name'),
                'customer_email' => $request->validated('customer_email'),
                'customer_phone' => $request->validated('customer_phone'),
                'subtotal' => $subtotal,
                'tax' => $tax,
                'total' => $total,
                'collection_method' => $method,
                'status' => OrderStatus::Pending,
                'payment_status' => PaymentStatus::Unpaid,
                'pickup_time' => $method === CollectionMethod::Pickup
                    ? ($request->validated('pickup_time') ?? 'Ready in approximately 2 hours')
                    : null,
                'delivery_address' => $request->validated('delivery_address'),
                'delivery_time_preference' => $request->validated('delivery_time_preference'),
                'notes' => $request->validated('notes'),
            ]);

            $order->items()->createMany($lineItems);

            return $order->load('items');
        });

        $itemsList = $order->items
            ->map(fn ($item) => "{$item->product_name} x{$item->quantity} — $".number_format((float) $item->price * $item->quantity, 2))
            ->join("\n");

        $methodLabel = $method === CollectionMethod::Pickup
            ? 'Store Pickup — Ready in approximately 2 hours'
            : 'Delivery Request — We will contact you to confirm';

        Mail::raw(
            "Hi {$order->customer_name},\n\nThank you for your order!\n\nOrder #{$order->order_number}\n\n{$itemsList}\n\nSubtotal: $".number_format((float) $order->subtotal, 2)."\nTax: $".number_format((float) $order->tax, 2)."\nTotal: $".number_format((float) $order->total, 2)."\n\nCollection: {$methodLabel}\n\nRatal Foods\n226-348-7156\nWindsor, ON",
            function ($message) use ($order): void {
                $message->to($order->customer_email)
                    ->subject("Ratal Foods — Order Confirmation #{$order->order_number}");
            }
        );

        Mail::raw(
            "New order received!\n\nOrder #{$order->order_number}\nCustomer: {$order->customer_name}\nEmail: {$order->customer_email}\nPhone: {$order->customer_phone}\n\n{$itemsList}\n\nTotal: $".number_format((float) $order->total, 2)."\nMethod: {$methodLabel}\nNotes: ".($order->notes ?: 'None'),
            function ($message) use ($order): void {
                $message->to('info@ratalfoods.ca')
                    ->subject("New Order #{$order->order_number}");
            }
        );

        return redirect()
            ->route('checkout')
            ->with('orderComplete', [
                'order_number' => $order->order_number,
                'subtotal' => (float) $order->subtotal,
                'tax' => (float) $order->tax,
                'total' => (float) $order->total,
                'collection_method' => $order->collection_method->value,
                'customer_name' => $order->customer_name,
                'customer_email' => $order->customer_email,
            ]);
    }
}
