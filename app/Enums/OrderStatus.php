<?php

namespace App\Enums;

enum OrderStatus: string
{
    case Pending = 'pending';
    case Processing = 'processing';
    case PaymentConfirmed = 'payment_confirmed';
    case Ready = 'ready';
    case OutForDelivery = 'out_for_delivery';
    case Cancelled = 'cancelled';
    case Completed = 'completed';
    case Delivered = 'delivered';
    case Refunded = 'refunded';
    case Disputed = 'disputed';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Processing => 'Preparing',
            self::PaymentConfirmed => 'Payment Confirmed',
            self::Ready => 'Ready for Pickup',
            self::OutForDelivery => 'Out for Delivery',
            self::Cancelled => 'Cancelled',
            self::Completed => 'Completed',
            self::Delivered => 'Delivered',
            self::Refunded => 'Refunded',
            self::Disputed => 'Disputed',
        };
    }

    /**
     * Where the order is on the customer-facing timeline (0 received ... 3 finished),
     * or null for statuses that end the order early.
     */
    public function timelineStep(): ?int
    {
        return match ($this) {
            self::Pending, self::PaymentConfirmed => 0,
            self::Processing => 1,
            self::Ready, self::OutForDelivery => 2,
            self::Completed, self::Delivered => 3,
            self::Cancelled, self::Refunded, self::Disputed => null,
        };
    }

    /**
     * Statuses that trigger an email to the customer.
     */
    public function notifiesCustomer(): bool
    {
        return in_array($this, [
            self::Processing, self::Ready, self::OutForDelivery, self::Completed, self::Delivered, self::Cancelled,
        ], true);
    }

    public function isFinished(): bool
    {
        return in_array($this, [self::Completed, self::Delivered, self::Cancelled, self::Refunded], true);
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
