<?php

namespace App\Mail;

use App\Enums\CollectionMethod;
use App\Models\Order;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class NewOrderReceived extends Mailable
{
    public function __construct(public Order $order) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            replyTo: [new Address($this->order->customer_email, $this->order->customer_name)],
            subject: "New Order #{$this->order->order_number} — "
                .($this->order->collection_method === CollectionMethod::Pickup ? 'Pickup' : 'Delivery'),
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.orders.new',
            with: [
                'order' => $this->order->loadMissing('items'),
                'adminUrl' => route('admin.orders.index'),
            ],
        );
    }
}
