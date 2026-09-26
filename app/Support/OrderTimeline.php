<?php

namespace App\Support;

use App\Enums\CollectionMethod;
use App\Enums\OrderStatus;
use App\Models\Order;

class OrderTimeline
{
    /**
     * Build the customer-facing progress steps for an order.
     *
     * @return array{steps: list<array<string, mixed>>, notice: array{tone: string, title: string, message: string}|null, is_finished: bool}
     */
    public static function for(Order $order): array
    {
        $pickup = $order->collection_method === CollectionMethod::Pickup;
        $status = $order->status;
        $current = $status->timelineStep();

        $reachedAt = $order->statusEvents()->get()
            ->mapWithKeys(fn ($event) => [$event->status->value => $event->created_at])
            ->all();

        $stepTime = function (array $statuses) use ($reachedAt) {
            foreach ($statuses as $candidate) {
                if (isset($reachedAt[$candidate])) {
                    return $reachedAt[$candidate]->toIso8601String();
                }
            }

            return null;
        };

        $definitions = [
            [
                'key' => 'received',
                'label' => 'Order received',
                'description' => 'We have your order and will start on it shortly.',
                'statuses' => ['pending', 'payment_confirmed'],
            ],
            [
                'key' => 'preparing',
                'label' => 'Preparing your food',
                'description' => 'The kitchen is cooking your order fresh.',
                'statuses' => ['processing'],
            ],
            [
                'key' => 'ready',
                'label' => $pickup ? 'Ready for pickup' : 'Out for delivery',
                'description' => $pickup ? 'Your order is packed and waiting for you at the store.' : 'Your order is on its way to you.',
                'statuses' => ['ready', 'out_for_delivery'],
            ],
            [
                'key' => 'done',
                'label' => $pickup ? 'Picked up' : 'Delivered',
                'description' => 'Enjoy your meal!',
                'statuses' => ['completed', 'delivered'],
            ],
        ];

        $steps = [];
        foreach ($definitions as $index => $definition) {
            $state = 'upcoming';

            if ($current !== null) {
                $state = $index < $current ? 'done' : ($index === $current ? 'current' : 'upcoming');

                // The final step is a result, not something still in progress.
                if ($index === 3 && $current === 3) {
                    $state = 'done';
                }
            }

            $steps[] = [
                'key' => $definition['key'],
                'label' => $definition['label'],
                'description' => $definition['description'],
                'state' => $state,
                'reached_at' => $state === 'upcoming' ? null : $stepTime($definition['statuses']),
            ];
        }

        $notice = match ($status) {
            OrderStatus::Cancelled => ['tone' => 'neutral', 'title' => 'Order cancelled', 'message' => 'This order was cancelled. If you did not expect this, please contact the store.'],
            OrderStatus::Refunded => ['tone' => 'neutral', 'title' => 'Order refunded', 'message' => 'This order has been refunded. It can take a few days to appear on your statement.'],
            OrderStatus::Disputed => ['tone' => 'warning', 'title' => 'Payment under review', 'message' => 'The payment for this order is being reviewed. We will be in touch if we need anything from you.'],
            default => null,
        };

        return [
            'steps' => $steps,
            'notice' => $notice,
            'is_finished' => $status->isFinished() || $status === OrderStatus::Disputed,
        ];
    }
}
