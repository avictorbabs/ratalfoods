<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class StripeOrderAlert extends Mailable
{
    /**
     * @param  'refund'|'dispute'  $kind
     * @param  array<string, mixed>  $details
     */
    public function __construct(public Order $order, public string $kind, public array $details) {}

    public function envelope(): Envelope
    {
        $label = $this->kind === 'dispute' ? 'Payment dispute' : 'Refund issued';

        return new Envelope(subject: "{$label} — Order #{$this->order->order_number}");
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.orders.stripe-alert',
            with: [
                'order' => $this->order,
                'kind' => $this->kind,
                'details' => $this->details,
                'adminUrl' => route('admin.orders.index'),
            ],
        );
    }
}
