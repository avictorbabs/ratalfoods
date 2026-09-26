<?php

namespace App\Models;

use App\Enums\BookingStatus;
use App\Enums\BookingType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Booking extends Model
{
    protected $fillable = [
        'booking_number',
        'user_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'booking_type',
        'date',
        'time',
        'guests',
        'occasion',
        'notes',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'booking_type' => BookingType::class,
            'status' => BookingStatus::class,
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Booking $booking): void {
            if (empty($booking->booking_number)) {
                $booking->booking_number = 'BKG-'.strtoupper(uniqid());
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function typeLabel(): string
    {
        return match ($this->booking_type) {
            BookingType::DineIn => 'Dine In',
            BookingType::Catering => 'Catering',
            BookingType::PrivateEvent => 'Private Event',
        };
    }

    /**
     * A human-readable line describing party size, worded for the booking
     * type. Catering bookings don't collect a guest count, so this is null.
     */
    public function partySizeLine(): ?string
    {
        return match ($this->booking_type) {
            BookingType::DineIn => "Tables: {$this->guests}",
            BookingType::PrivateEvent => "Guests: {$this->guests}",
            BookingType::Catering => null,
        };
    }
}
