<?php

namespace App\Http\Controllers;

use App\Enums\CollectionMethod;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Requests\StoreOrderRequest;
use App\Models\DeliveryFee;
use App\Models\Order;
use App\Models\Product;
use App\Models\StoreSetting;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Stripe\Checkout\Session as StripeSession;
use Stripe\Stripe;
use Symfony\Component\HttpFoundation\Response;

class OrderController extends Controller
{
    public function store(StoreOrderRequest $request): RedirectResponse|Response
    {
        $paymentMethod = $request->validated('payment_method');
        $order = $this->createOrder($request);

        if ($paymentMethod === 'stripe') {
            return $this->redirectToStripe($order);
        }

        $this->sendOrderEmails($order);

        return $this->redirectOrderComplete($order);
    }

    public function stripeSuccess(Request $request): RedirectResponse
    {
        $sessionId = $request->string('session_id')->toString();

        if ($sessionId === '') {
            return redirect()->route('checkout')->withErrors([
                'payment' => 'Payment session was not found.',
            ]);
        }

        $secret = config('services.stripe.secret');

        if (! is_string($secret) || $secret === '') {
            return redirect()->route('checkout')->withErrors([
                'payment' => 'Online payment is not configured yet.',
            ]);
        }

        Stripe::setApiKey($secret);

        try {
            $session = StripeSession::retrieve($sessionId);
        } catch (\Throwable) {
            return redirect()->route('checkout')->withErrors([
                'payment' => 'Unable to verify your payment. Please contact the store.',
            ]);
        }

        $orderId = $session->metadata['order_id'] ?? null;
        $order = $orderId ? Order::query()->with('items')->find($orderId) : null;

        if (! $order || $order->stripe_session_id !== $sessionId) {
            return redirect()->route('checkout')->withErrors([
                'payment' => 'Order payment could not be matched.',
            ]);
        }

        if ($session->payment_status === 'paid' && $order->payment_status !== PaymentStatus::Paid) {
            $order->update([
                'payment_status' => PaymentStatus::Paid,
                'status' => OrderStatus::PaymentConfirmed,
            ]);
            $this->sendOrderEmails($order->fresh(['items']), paidOnline: true);
        }

        return $this->redirectOrderComplete($order->fresh(['items']));
    }

    public function stripeCancel(): RedirectResponse
    {
        return redirect()
            ->route('checkout')
            ->withErrors([
                'payment' => 'Payment was cancelled. You can try again when ready.',
            ]);
    }

    private function createOrder(StoreOrderRequest $request): Order
    {
        $settings = StoreSetting::current();
        $productIds = collect($request->validated('items'))->pluck('product_id')->unique();
        $products = Product::query()
            ->whereIn('id', $productIds)
            ->where('is_active', true)
            ->get()
            ->keyBy('id');

        if ($products->count() !== $productIds->count()) {
            throw ValidationException::withMessages([
                'items' => 'One or more products are no longer available.',
            ]);
        }

        $method = CollectionMethod::from($request->validated('collection_method'));
        $paymentMethod = $request->validated('payment_method');

        $pickupTime = null;
        if ($method === CollectionMethod::Pickup) {
            $pickupDate = $request->validated('pickup_date');
            $pickupSlot = $request->validated('pickup_time');
            $pickupTime = Carbon::parse($pickupDate)->format('F j, Y').' at '.$pickupSlot;
        }

        $deliveryTimePreference = null;
        $deliveryFee = 0.0;
        $deliveryZone = null;

        if ($method === CollectionMethod::DeliveryRequest) {
            $deliveryDate = $request->validated('delivery_date');
            $deliveryTime = substr((string) $request->validated('delivery_time'), 0, 5);
            $deliveryTimePreference = Carbon::parse($deliveryDate)->format('F j, Y').' at '.Carbon::createFromFormat('H:i', $deliveryTime)->format('g:i A');

            $matchedZone = DeliveryFee::resolveForAddress($request->validated('delivery_address'));

            if (! $matchedZone) {
                throw ValidationException::withMessages([
                    'delivery_address' => 'We could not match a delivery zone for this address. Please check the address or contact the store.',
                ]);
            }

            $deliveryFee = (float) $matchedZone->fee;
            $deliveryZone = $matchedZone->name;
        }

        return DB::transaction(function () use ($request, $settings, $products, $method, $pickupTime, $deliveryTimePreference, $paymentMethod, $deliveryFee, $deliveryZone) {
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
            $total = round($subtotal + $tax + $deliveryFee, 2);

            $order = Order::query()->create([
                'user_id' => $request->user()?->id,
                'customer_name' => $request->validated('customer_name'),
                'customer_email' => $request->validated('customer_email'),
                'customer_phone' => $request->validated('customer_phone'),
                'subtotal' => $subtotal,
                'tax' => $tax,
                'delivery_fee' => $deliveryFee,
                'delivery_zone' => $deliveryZone,
                'total' => $total,
                'collection_method' => $method,
                'status' => OrderStatus::Pending,
                'payment_status' => PaymentStatus::Unpaid,
                'payment_method' => $paymentMethod,
                'pickup_time' => $pickupTime,
                'delivery_address' => $request->validated('delivery_address'),
                'delivery_time_preference' => $deliveryTimePreference,
                'notes' => $request->validated('notes'),
            ]);

            $order->items()->createMany($lineItems);

            return $order->load('items');
        });
    }

    private function redirectToStripe(Order $order): RedirectResponse|Response
    {
        $secret = config('services.stripe.secret');

        if (! is_string($secret) || $secret === '') {
            return back()->withErrors([
                'payment' => 'Online payment is not configured yet. Please choose Cash on Delivery or contact the store.',
            ]);
        }

        Stripe::setApiKey($secret);

        $lineItems = $order->items->map(fn ($item) => [
            'price_data' => [
                'currency' => 'cad',
                'product_data' => [
                    'name' => $item->product_name,
                ],
                'unit_amount' => (int) round(((float) $item->price) * 100),
            ],
            'quantity' => $item->quantity,
        ])->values()->all();

        if ((float) $order->tax > 0) {
            $lineItems[] = [
                'price_data' => [
                    'currency' => 'cad',
                    'product_data' => [
                        'name' => 'Tax',
                    ],
                    'unit_amount' => (int) round(((float) $order->tax) * 100),
                ],
                'quantity' => 1,
            ];
        }

        if ((float) $order->delivery_fee > 0) {
            $lineItems[] = [
                'price_data' => [
                    'currency' => 'cad',
                    'product_data' => [
                        'name' => $order->delivery_zone
                            ? "Delivery ({$order->delivery_zone})"
                            : 'Delivery Fee',
                    ],
                    'unit_amount' => (int) round(((float) $order->delivery_fee) * 100),
                ],
                'quantity' => 1,
            ];
        }

        try {
            $session = StripeSession::create([
                'mode' => 'payment',
                'customer_email' => $order->customer_email,
                'line_items' => $lineItems,
                'success_url' => route('orders.stripe.success').'?session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => route('orders.stripe.cancel'),
                'metadata' => [
                    'order_id' => (string) $order->id,
                    'order_number' => $order->order_number,
                ],
            ]);
        } catch (\Throwable $exception) {
            report($exception);

            return back()->withErrors([
                'payment' => 'Unable to start Stripe checkout. Please try again or use Cash on Delivery.',
            ]);
        }

        $order->update([
            'stripe_session_id' => $session->id,
        ]);

        return Inertia::location($session->url);
    }

    private function sendOrderEmails(Order $order, bool $paidOnline = false): void
    {
        $itemsList = $order->items
            ->map(fn ($item) => "{$item->product_name} x{$item->quantity} — $".number_format((float) $item->price * $item->quantity, 2))
            ->join("\n");

        $methodLabel = $order->collection_method === CollectionMethod::Pickup
            ? 'Store Pickup — '.($order->pickup_time ?: 'TBD')
            : 'Delivery — '.($order->delivery_time_preference ?: 'Scheduled');

        $paymentLabel = match ($order->payment_method) {
            'stripe' => $paidOnline ? 'Paid online (Stripe)' : 'Pay online (Stripe)',
            default => $order->collection_method === CollectionMethod::Pickup
                ? 'Cash on delivery / pay at pickup'
                : 'Cash on delivery',
        };

        $customerBody = "Hi {$order->customer_name},\n\n"
            ."Thank you for your order with Ratal Foods!\n\n"
            ."========== ORDER INVOICE ==========\n"
            ."Order #: {$order->order_number}\n"
            ."Collection: {$methodLabel}\n"
            ."Payment: {$paymentLabel}\n\n"
            ."Items:\n{$itemsList}\n\n"
            .'Subtotal: $'.number_format((float) $order->subtotal, 2)."\n"
            .'Tax: $'.number_format((float) $order->tax, 2)."\n"
            .'Delivery: $'.number_format((float) $order->delivery_fee, 2)
            .($order->delivery_zone ? " ({$order->delivery_zone})" : '')."\n"
            .'Total: $'.number_format((float) $order->total, 2)."\n"
            ."===================================\n\n"
            ."Please keep this email for your records. We may call you if further clarification is needed.\n\n"
            ."Ratal Foods\n226-348-7156\nWindsor, ON";

        try {
            Mail::raw($customerBody, function ($message) use ($order): void {
                $message->to($order->customer_email)
                    ->subject("Ratal Foods — Order Invoice #{$order->order_number}");
            });

            Mail::raw(
                "New order received!\n\nOrder #{$order->order_number}\nCustomer: {$order->customer_name}\nEmail: {$order->customer_email}\nPhone: {$order->customer_phone}\n\n{$itemsList}\n\nSubtotal: $".number_format((float) $order->subtotal, 2)."\nTax: $".number_format((float) $order->tax, 2)."\nDelivery: $".number_format((float) $order->delivery_fee, 2).($order->delivery_zone ? " ({$order->delivery_zone})" : '')."\nTotal: $".number_format((float) $order->total, 2)."\nMethod: {$methodLabel}\nPayment: {$paymentLabel}\nNotes: ".($order->notes ?: 'None'),
                function ($message) use ($order): void {
                    $message->to('info@ratalfoods.ca')
                        ->subject("New Order #{$order->order_number}");
                }
            );
        } catch (\Throwable $exception) {
            report($exception);
        }
    }

    private function redirectOrderComplete(Order $order): RedirectResponse
    {
        return redirect()
            ->route('checkout')
            ->with('orderComplete', [
                'order_number' => $order->order_number,
                'subtotal' => (float) $order->subtotal,
                'tax' => (float) $order->tax,
                'delivery_fee' => (float) $order->delivery_fee,
                'delivery_zone' => $order->delivery_zone,
                'total' => (float) $order->total,
                'collection_method' => $order->collection_method->value,
                'customer_name' => $order->customer_name,
                'customer_email' => $order->customer_email,
                'pickup_time' => $order->pickup_time,
                'payment_method' => $order->payment_method,
            ]);
    }
}
