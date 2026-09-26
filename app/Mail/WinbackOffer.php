<?php

namespace App\Mail;

use App\Models\Coupon;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Headers;
use Illuminate\Support\Facades\URL;

class WinbackOffer extends Mailable
{
    public function __construct(public string $name, public string $email, public Coupon $coupon) {}

    public function unsubscribeUrl(): string
    {
        return URL::signedRoute('unsubscribe', ['email' => $this->email]);
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: "We miss you, {$this->firstName()}! Here is {$this->coupon->description()}");
    }

    public function headers(): Headers
    {
        return new Headers(text: [
            'List-Unsubscribe' => '<'.$this->unsubscribeUrl().'>',
        ]);
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.marketing.winback',
            with: [
                'firstName' => $this->firstName(),
                'coupon' => $this->coupon,
                'unsubscribeUrl' => $this->unsubscribeUrl(),
            ],
        );
    }

    private function firstName(): string
    {
        return explode(' ', trim($this->name))[0] ?: 'there';
    }
}
