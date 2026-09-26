<?php

namespace App\Mail;

use App\Models\RecurringOrder;
use Carbon\CarbonImmutable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class RecurringOrderProblem extends Mailable
{
    public function __construct(public RecurringOrder $recurring, public CarbonImmutable $date, public string $reason) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'We could not prepare your repeat order for '.$this->date->format('F j'));
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.orders.recurring-problem',
            with: [
                'recurring' => $this->recurring,
                'date' => $this->date,
                'reason' => $this->reason,
                'manageUrl' => route('dashboard.recurring'),
            ],
        );
    }
}
