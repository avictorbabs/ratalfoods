<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class NewsletterSignupReceived extends Mailable
{
    public function __construct(public string $name, public string $email) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            replyTo: [new Address($this->email, $this->name)],
            subject: "Newsletter signup — {$this->name}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.newsletter.received',
            with: [
                'name' => $this->name,
                'email' => $this->email,
            ],
        );
    }
}
