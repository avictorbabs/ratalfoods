<?php

namespace App\Mail;

use App\Models\AbandonedCart;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class AbandonedCartReminder extends Mailable
{
    /**
     * @param  list<array<string, mixed>>  $lines
     */
    public function __construct(public AbandonedCart $cart, public array $lines) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'You left something delicious in your cart');
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.orders.abandoned-cart',
            with: [
                'name' => $this->cart->name,
                'lines' => $this->lines,
                'url' => route('cart.recover', $this->cart->token),
            ],
        );
    }
}
