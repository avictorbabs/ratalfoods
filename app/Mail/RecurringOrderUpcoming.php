<?php

namespace App\Mail;

use App\Models\Order;
use App\Models\RecurringOrder;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class RecurringOrderUpcoming extends Mailable
{
    public function __construct(public Order $order, public RecurringOrder $recurring, public string $skipUrl) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Your repeat order is set: '.$this->order->collectionLabel());
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.orders.recurring-upcoming',
            with: [
                'order' => $this->order,
                'recurring' => $this->recurring,
                'skipUrl' => $this->skipUrl,
                'manageUrl' => route('dashboard.recurring'),
            ],
        );
    }
}
