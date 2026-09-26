<?php

namespace App\Mail;

use App\Enums\CollectionMethod;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\StoreSetting;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class OrderStatusUpdate extends Mailable
{
    public function __construct(public Order $order, public OrderStatus $status) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->headline().' — order '.$this->order->order_number);
    }

    public function headline(): string
    {
        $pickup = $this->order->collection_method === CollectionMethod::Pickup;

        return match ($this->status) {
            OrderStatus::Processing => 'We are preparing your order',
            OrderStatus::Ready => 'Your order is ready for pickup',
            OrderStatus::OutForDelivery => 'Your order is on its way',
            OrderStatus::Completed, OrderStatus::Delivered => $pickup ? 'Enjoy your meal' : 'Your order has been delivered',
            OrderStatus::Cancelled => 'Your order was cancelled',
            default => 'Your order was updated',
        };
    }

    public function message(): string
    {
        $store = StoreSetting::current();

        return match ($this->status) {
            OrderStatus::Processing => 'Our kitchen has started cooking your order. We will let you know as soon as it is ready.',
            OrderStatus::Ready => "Your order is packed and waiting for you at {$store->address}. Please bring your order number.",
            OrderStatus::OutForDelivery => 'Your order has left the kitchen and is heading to your address.',
            OrderStatus::Completed, OrderStatus::Delivered => 'Thank you for choosing Ratal Foods. We hope everything was delicious!',
            OrderStatus::Cancelled => 'Your order has been cancelled. If you did not expect this, please reply to this email or call us and we will sort it out.',
            default => 'There is an update on your order.',
        };
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.orders.status-update',
            with: [
                'order' => $this->order,
                'headline' => $this->headline(),
                'body' => $this->message(),
                'showTracking' => $this->status !== OrderStatus::Cancelled,
            ],
        );
    }
}
