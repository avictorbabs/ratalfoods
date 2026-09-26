<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class NewBookingReceived extends Mailable
{
    public function __construct(public Booking $booking) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            replyTo: [new Address($this->booking->customer_email, $this->booking->customer_name)],
            subject: "New Booking — {$this->booking->booking_number}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.bookings.new',
            with: [
                'booking' => $this->booking,
                'adminUrl' => route('admin.bookings.index'),
            ],
        );
    }
}
