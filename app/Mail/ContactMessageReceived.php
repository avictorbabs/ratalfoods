<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class ContactMessageReceived extends Mailable
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function __construct(public array $data) {}

    public function envelope(): Envelope
    {
        $isDelivery = ($this->data['type'] ?? 'general') === 'delivery';

        return new Envelope(
            replyTo: [new Address($this->data['email'], $this->data['name'])],
            subject: $isDelivery
                ? "Delivery Request from {$this->data['name']}"
                : "Contact from {$this->data['name']}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.contact.received',
            with: [
                'data' => $this->data,
                'isDelivery' => ($this->data['type'] ?? 'general') === 'delivery',
            ],
        );
    }
}
