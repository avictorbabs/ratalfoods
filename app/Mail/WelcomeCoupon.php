<?php

namespace App\Mail;

use App\Models\Coupon;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class WelcomeCoupon extends Mailable
{
    public function __construct(public string $name, public Coupon $coupon) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "Your welcome offer: {$this->coupon->description()} your first order");
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.newsletter.welcome',
            with: ['name' => $this->name, 'coupon' => $this->coupon],
        );
    }
}
