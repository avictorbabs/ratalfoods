<?php

namespace App\Http\Controllers;

use App\Actions\ConfirmStripePayment;
use App\Actions\SendOrderNotifications;
use App\Enums\CollectionMethod;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Requests\StoreOrderRequest;
use App\Models\AbandonedCart;
use App\Models\Coupon;
use App\Models\DeliveryFee;
use App\Models\Order;
use App\Models\Product;
use App\Models\StoreSetting;
use App\Support\CouponException;
use App\Support\GuestSignup;
use App\Support\Loyalty;
use App\Support\LoyaltyException;
use App\Support\RecurringOrderException;
use App\Support\RecurringOrders;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Stripe\Checkout\Session as StripeSession;
use Stripe\Coupon as StripeCoupon;
use Stripe\Stripe;
use Symfony\Component\HttpFoundation\Response;

class OrderController extends Controller
{
    public function store(StoreOrderRequest $request, SendOrderNotifications $notifications): RedirectResponse|Response
    {
        $paymentMethod = $request->validated('payment_method');
        $order = $this->createOrder($request);

        if ($paymentMethod === 'stripe') {
            return $this->redirectToStripe($order);
        }

        $notifications->handle($order);

        return $this->redirectOrderComplete($order);
    }

    public function stripeSuccess(Request $request, ConfirmStripePayment $confirmPayment): RedirectResponse
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

        $order = $confirmPayment->handle($session);

        if (! $order) {
            return redirect()->route('checkout')->withErrors([
                'payment' => 'Order payment could not be matched.',
            ]);
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

            $discount = 0.0;
            $coupon = null;

            if ($couponCode = $request->validated('coupon_code')) {
                try {
                    $coupon = Coupon::resolveForOrder(
                        $couponCode,
                        (float) $subtotal,
                        (string) $request->validated('customer_email'),
                        $request->user()?->id,
                        lock: true,
                    );
                } catch (CouponException $exception) {
                    throw ValidationException::withMessages(['coupon_code' => $exception->getMessage()]);
                }

                $discount = $coupon->discountFor((float) $subtotal);
            }

            $loyaltyPoints = 0;
            $loyaltyDiscount = 0.0;

            if ($request->boolean('use_points')) {
                $user = $request->user();

                if (! $user || ! $user->hasVerifiedEmail()) {
                    throw ValidationException::withMessages(['use_points' => 'Please log in with a verified account to use your points.']);
                }

                $redeemable = Loyalty::redeemable($user, (float) $subtotal - $discount);

                if ($redeemable['points'] === 0) {
                    throw ValidationException::withMessages(['use_points' => 'You do not have enough points to use on this order.']);
                }

                $loyaltyPoints = $redeemable['points'];
                $loyaltyDiscount = $redeemable['discount'];
            }

            $taxable = $subtotal - $discount - $loyaltyDiscount;
            $tax = round($taxable * ((float) $settings->tax_rate / 100), 2);
            $total = round($taxable + $tax + $deliveryFee, 2);

            $order = Order::query()->create([
                'user_id' => $request->user()?->id,
                'customer_name' => $request->validated('customer_name'),
                'customer_email' => $request->validated('customer_email'),
                'customer_phone' => $request->validated('customer_phone'),
                'subtotal' => $subtotal,
                'discount' => $discount,
                'loyalty_points_redeemed' => $loyaltyPoints,
                'loyalty_discount' => $loyaltyDiscount,
                'coupon_id' => $coupon?->id,
                'coupon_code' => $coupon?->code,
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

            if ($loyaltyPoints > 0) {
                try {
                    Loyalty::redeem($request->user(), $order, $loyaltyPoints);
                } catch (LoyaltyException $exception) {
                    throw ValidationException::withMessages(['use_points' => $exception->getMessage()]);
                }
            }

            if ($request->filled('repeat')) {
                $user = $request->user();

                if (! $user || ! $user->hasVerifiedEmail()) {
                    throw ValidationException::withMessages(['repeat' => 'Please log in with a verified account to repeat an order.']);
                }

                if ($paymentMethod !== 'cash_on_delivery') {
                    throw ValidationException::withMessages(['repeat' => 'Repeat orders are pay on pickup or delivery for now. Please choose that payment option.']);
                }

                try {
                    RecurringOrders::createFromCheckout($user, $order, [
                        'frequency' => $request->validated('repeat'),
                        'service_date' => $method === CollectionMethod::Pickup ? $request->validated('pickup_date') : $request->validated('delivery_date'),
                        'ends_on' => $request->validated('repeat_until'),
                        'pickup_time' => $request->validated('pickup_time'),
                        'delivery_time' => $request->validated('delivery_time'),
                        'items' => $request->validated('items'),
                    ]);
                } catch (RecurringOrderException $exception) {
                    throw ValidationException::withMessages(['repeat' => $exception->getMessage()]);
                }
            }

            AbandonedCart::query()->whereRaw('lower(email) = ?', [strtolower((string) $request->validated('customer_email'))])->delete();

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

        $discounts = [];

        try {
            $totalDiscount = (float) $order->discount + (float) $order->loyalty_discount;

            if ($totalDiscount > 0) {
                // Order totals apply discounts before tax, so a one-off amount-off
                // coupon makes Stripe's total match ours exactly.
                $stripeCoupon = StripeCoupon::create([
                    'amount_off' => (int) round($totalDiscount * 100),
                    'currency' => 'cad',
                    'duration' => 'once',
                    'name' => $order->coupon_code ?: 'Discount',
                ]);
                $discounts[] = ['coupon' => $stripeCoupon->id];
            }

            $session = StripeSession::create([
                'mode' => 'payment',
                'customer_email' => $order->customer_email,
                'line_items' => $lineItems,
                ...($discounts !== [] ? ['discounts' => $discounts] : []),
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

    private function redirectOrderComplete(Order $order): RedirectResponse
    {
        return redirect()
            ->route('checkout')
            ->with('orderComplete', [
                'order_number' => $order->order_number,
                'subtotal' => (float) $order->subtotal,
                'discount' => (float) $order->discount,
                'loyalty_discount' => (float) $order->loyalty_discount,
                'loyalty_points_redeemed' => (int) $order->loyalty_points_redeemed,
                'coupon_code' => $order->coupon_code,
                'tax' => (float) $order->tax,
                'delivery_fee' => (float) $order->delivery_fee,
                'delivery_zone' => $order->delivery_zone,
                'total' => (float) $order->total,
                'collection_method' => $order->collection_method->value,
                'customer_name' => $order->customer_name,
                'customer_email' => $order->customer_email,
                'pickup_time' => $order->pickup_time,
                'payment_method' => $order->payment_method,
                'tracking_url' => $order->tracking_url,
                'guest_signup' => GuestSignup::prompt(auth()->user(), $order->customer_name, $order->customer_email),
            ]);
    }
}
