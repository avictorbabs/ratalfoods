<?php

namespace App\Enums;

enum OrderStatus: string
{
    case Pending = 'pending';
    case Processing = 'processing';
    case PaymentConfirmed = 'payment_confirmed';
    case Cancelled = 'cancelled';
    case Completed = 'completed';
    case Delivered = 'delivered';
    case Refunded = 'refunded';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Processing => 'Processing',
            self::PaymentConfirmed => 'Payment Confirmed',
            self::Cancelled => 'Cancelled',
            self::Completed => 'Completed',
            self::Delivered => 'Delivered',
            self::Refunded => 'Refunded',
        };
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
