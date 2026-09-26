<?php

namespace App\Mail;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Support\Collection;

class ReviewRequest extends Mailable
{
    /**
     * @param  Collection<int, Product>  $products
     */
    public function __construct(public Order $order, public Collection $products) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'How was your order from Ratal Foods?');
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.orders.review-request',
            with: ['order' => $this->order, 'products' => $this->products],
        );
    }
}
