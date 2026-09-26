<?php

namespace App\Http\Controllers;

use App\Actions\SendOrderNotifications;
use App\Enums\BookingStatus;
use App\Enums\BookingType;
use App\Http\Requests\StoreBookingRequest;
use App\Mail\BookingConfirmation;
use App\Mail\NewBookingReceived;
use App\Models\Booking;
use App\Support\GuestSignup;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class BookingController extends Controller
{
    public function store(StoreBookingRequest $request): RedirectResponse
    {
        $attributes = $request->safe()->except('recaptcha');
        $attributes['booking_type'] = BookingType::from($attributes['booking_type']);

        if ($attributes['booking_type'] === BookingType::Catering) {
            // Catering doesn't collect a guest/table count; let the column's
            // default apply instead of storing a number the customer never gave.
            unset($attributes['guests']);
        }

        $booking = Booking::query()->create([
            ...$attributes,
            'user_id' => $request->user()?->id,
            'status' => BookingStatus::Pending,
        ]);

        defer(function () use ($booking): void {
            try {
                Mail::to($booking->customer_email, $booking->customer_name)
                    ->send(new BookingConfirmation($booking));

                Mail::to(SendOrderNotifications::storeRecipients())
                    ->send(new NewBookingReceived($booking));
            } catch (Throwable $exception) {
                Log::error("Could not send booking emails for {$booking->booking_number}", [
                    'booking_id' => $booking->id,
                    'error' => $exception->getMessage(),
                ]);
                report($exception);
            }
        }, "booking-emails-{$booking->id}");

        return back()->with([
            'success' => 'Your booking request has been submitted.',
            'bookingNumber' => $booking->booking_number,
            'guestSignup' => GuestSignup::prompt($request->user(), $booking->customer_name, $booking->customer_email),
        ]);
    }
}
