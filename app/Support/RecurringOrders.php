<?php

namespace App\Support;

use App\Actions\SendOrderNotifications;
use App\Enums\CollectionMethod;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Mail\NewOrderReceived;
use App\Mail\RecurringOrderProblem;
use App\Mail\RecurringOrderUpcoming;
use App\Models\DeliveryFee;
use App\Models\Order;
use App\Models\RecurringOrder;
use App\Models\StoreSetting;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Throwable;

class RecurringOrders
{
    /**
     * Turn a checkout into a repeat schedule. The order just placed is the first one;
     * the schedule carries on from the following cycle.
     *
     * @param  array<string, mixed>  $data  frequency, service_date, ends_on, items
     *
     * @throws RecurringOrderException
     */
    public static function createFromCheckout(User $user, Order $first, array $data): RecurringOrder
    {
        $active = RecurringOrder::query()->where('user_id', $user->id)->where('status', RecurringOrder::ACTIVE)->count();

        if ($active >= (int) config('marketing.recurring_max_active')) {
            throw new RecurringOrderException('You already have the maximum number of repeat orders. Cancel one to add another.');
        }

        $serviceDate = CarbonImmutable::parse($data['service_date'])->startOfDay();
        $interval = $data['frequency'] === RecurringOrder::BIWEEKLY ? 14 : 7;
        $endsOn = filled($data['ends_on'] ?? null) ? CarbonImmutable::parse($data['ends_on'])->startOfDay() : null;

        if ($endsOn && $endsOn->lt($serviceDate)) {
            throw new RecurringOrderException('The last date for a repeat order must be after the first delivery or pickup date.');
        }

        $pickup = $first->collection_method === CollectionMethod::Pickup;

        $recurring = RecurringOrder::query()->create([
            'user_id' => $user->id,
            'status' => RecurringOrder::ACTIVE,
            'frequency' => $data['frequency'],
            'collection_method' => $first->collection_method,
            'customer_name' => $first->customer_name,
            'customer_email' => $first->customer_email,
            'customer_phone' => $first->customer_phone,
            'pickup_slot' => $pickup ? $data['pickup_time'] : null,
            'delivery_slot' => $pickup ? null : substr((string) $data['delivery_time'], 0, 5),
            'delivery_address' => $pickup ? null : $first->delivery_address,
            'notes' => $first->notes,
            'items' => collect($data['items'])->map(fn (array $item) => [
                'product_id' => (int) $item['product_id'],
                'quantity' => (int) $item['quantity'],
            ])->values()->all(),
            'next_service_date' => $serviceDate->addDays($interval)->toDateString(),
            'ends_on' => $endsOn?->toDateString(),
            'skipped_dates' => [],
        ]);

        $first->forceFill(['recurring_order_id' => $recurring->id, 'recurring_for' => $serviceDate->toDateString()])->saveQuietly();

        return $recurring;
    }

    /**
     * Create the order for one service date.
     *
     * @return array{order: Order, unavailable: list<string>}
     *
     * @throws RecurringOrderException When the order cannot be prepared (shown to the customer in plain words).
     */
    public static function generate(RecurringOrder $recurring, CarbonImmutable $date): array
    {
        $resolved = CartLines::resolve($recurring->items);

        if ($resolved['lines'] === []) {
            throw new RecurringOrderException('None of the dishes in this repeat order are on the menu right now.');
        }

        $settings = StoreSetting::current();
        $pickup = $recurring->collection_method === CollectionMethod::Pickup;
        $deliveryFee = 0.0;
        $zoneName = null;

        if (! $pickup) {
            $zone = DeliveryFee::resolveForAddress($recurring->delivery_address);

            if (! $zone) {
                throw new RecurringOrderException('We could not match a delivery area for your address. Please contact us so we can sort it out.');
            }

            $deliveryFee = (float) $zone->fee;
            $zoneName = $zone->name;
        }

        $subtotal = collect($resolved['lines'])->sum(fn (array $line) => $line['price'] * $line['quantity']);
        $tax = round($subtotal * ((float) $settings->tax_rate / 100), 2);

        $notes = trim('Recurring order ('.$recurring->frequencyLabel().'). '.($recurring->notes ?? ''));
        if ($resolved['unavailable'] !== []) {
            $notes .= ' Not available this time: '.implode(', ', $resolved['unavailable']).'.';
        }

        $order = DB::transaction(function () use ($recurring, $resolved, $date, $pickup, $subtotal, $tax, $deliveryFee, $zoneName, $notes): Order {
            $order = Order::query()->create([
                'user_id' => $recurring->user_id,
                'customer_name' => $recurring->customer_name,
                'customer_email' => $recurring->customer_email,
                'customer_phone' => $recurring->customer_phone,
                'subtotal' => $subtotal,
                'tax' => $tax,
                'delivery_fee' => $deliveryFee,
                'delivery_zone' => $zoneName,
                'total' => round($subtotal + $tax + $deliveryFee, 2),
                'collection_method' => $recurring->collection_method,
                'status' => OrderStatus::Pending,
                'payment_status' => PaymentStatus::Unpaid,
                'payment_method' => 'cash_on_delivery',
                'pickup_time' => $pickup ? $date->format('F j, Y').' at '.$recurring->pickup_slot : null,
                'delivery_address' => $pickup ? null : $recurring->delivery_address,
                'delivery_time_preference' => $pickup ? null : $date->format('F j, Y').' at '.CarbonImmutable::createFromFormat('H:i', $recurring->delivery_slot)->format('g:i A'),
                'notes' => $notes,
                'recurring_order_id' => $recurring->id,
                'recurring_for' => $date->toDateString(),
            ]);

            $order->items()->createMany(collect($resolved['lines'])->map(fn (array $line) => [
                'product_id' => $line['product_id'],
                'product_name' => $line['product_name'],
                'quantity' => $line['quantity'],
                'price' => $line['price'],
            ])->all());

            return $order->load('items');
        });

        return ['order' => $order, 'unavailable' => $resolved['unavailable']];
    }

    /**
     * Create every order that is due inside the lead window for one schedule,
     * and email the customer. One bad occurrence never blocks the next one.
     */
    public static function process(RecurringOrder $recurring): int
    {
        $created = 0;
        $horizon = CarbonImmutable::today()->addDays((int) config('marketing.recurring_lead_days'));

        while ($recurring->status === RecurringOrder::ACTIVE) {
            $date = CarbonImmutable::parse($recurring->next_service_date)->startOfDay();

            if ($date->gt($horizon)) {
                break;
            }

            if ($recurring->ends_on && $date->gt($recurring->ends_on)) {
                $recurring->update(['status' => RecurringOrder::ENDED]);

                break;
            }

            $alreadyMade = $recurring->orders()->whereDate('recurring_for', $date->toDateString())->exists();

            // Skipped by the customer, in the past (system was off), or already created: just move on.
            if (! $alreadyMade && ! $recurring->isSkipped($date->toDateString()) && $date->gte(CarbonImmutable::today())) {
                try {
                    $result = self::generate($recurring, $date);
                    $created++;
                    self::announce($recurring, $result['order'], $date);
                } catch (RecurringOrderException $exception) {
                    self::tellCustomerAboutProblem($recurring, $date, $exception->getMessage());
                } catch (Throwable $exception) {
                    // Unexpected failure: log it, tell the customer in plain words, keep the schedule alive.
                    report($exception);
                    self::tellCustomerAboutProblem($recurring, $date, 'Something went wrong on our side while preparing it.');
                }
            }

            $recurring->update(['next_service_date' => $date->addDays($recurring->intervalDays())->toDateString()]);
        }

        return $created;
    }

    /**
     * Skip one service date. Cancels the order for that date if the kitchen has not started it.
     *
     * @throws RecurringOrderException
     */
    public static function skip(RecurringOrder $recurring, CarbonImmutable $date): void
    {
        $key = $date->toDateString();
        $order = $recurring->orders()->whereDate('recurring_for', $key)->first();

        if ($order && $order->status !== OrderStatus::Pending) {
            throw new RecurringOrderException(
                $order->status === OrderStatus::Cancelled
                    ? 'That order was already cancelled.'
                    : 'Too late to skip: the kitchen has already started on this order. Please call us if you need help.'
            );
        }

        DB::transaction(function () use ($recurring, $key, $order): void {
            if (! $recurring->isSkipped($key)) {
                $recurring->update(['skipped_dates' => array_values(array_unique([...($recurring->skipped_dates ?? []), $key]))]);
            }

            $order?->update(['status' => OrderStatus::Cancelled]);
        });
    }

    public static function skipUrl(RecurringOrder $recurring, CarbonImmutable $date): string
    {
        return URL::signedRoute('recurring.skip', ['recurring' => $recurring->id, 'date' => $date->toDateString()], now()->addDays(14));
    }

    private static function announce(RecurringOrder $recurring, Order $order, CarbonImmutable $date): void
    {
        try {
            Mail::to($order->customer_email, $order->customer_name)
                ->send(new RecurringOrderUpcoming($order, $recurring, self::skipUrl($recurring, $date)));

            Mail::to(SendOrderNotifications::storeRecipients())->send(new NewOrderReceived($order));
            $order->forceFill(['notified_at' => now()])->saveQuietly();
        } catch (Throwable $exception) {
            Log::error("Could not send recurring order emails for {$order->order_number}", ['error' => $exception->getMessage()]);
            report($exception);
        }
    }

    private static function tellCustomerAboutProblem(RecurringOrder $recurring, CarbonImmutable $date, string $reason): void
    {
        Log::warning("Recurring order {$recurring->id} could not be created for {$date->toDateString()}", ['reason' => $reason]);

        try {
            Mail::to($recurring->customer_email, $recurring->customer_name)->send(new RecurringOrderProblem($recurring, $date, $reason));
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
