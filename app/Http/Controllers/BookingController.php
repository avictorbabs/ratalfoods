<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Enums\BookingType;
use App\Http\Requests\StoreBookingRequest;
use App\Models\Booking;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Mail;

class BookingController extends Controller
{
    public function store(StoreBookingRequest $request): RedirectResponse
    {
        $booking = Booking::query()->create([
            ...$request->validated(),
            'user_id' => $request->user()?->id,
            'booking_type' => BookingType::from($request->validated('booking_type')),
            'status' => BookingStatus::Pending,
        ]);

        $customerBody = "Hi {$booking->customer_name},\n\n"
            ."Your {$booking->booking_type->value} booking has been received.\n\n"
            ."Booking #: {$booking->booking_number}\n"
            ."Date: {$booking->date->format('Y-m-d')}\n"
            ."Time: {$booking->time}\n"
            ."Guests: {$booking->guests}\n\n"
            ."We'll confirm shortly.\n\n— Ratal Foods";

        Mail::raw($customerBody, function ($message) use ($booking): void {
            $message->to($booking->customer_email)
                ->subject("Booking Received — {$booking->booking_number}");
        });

        Mail::raw(
            "New booking {$booking->booking_number}\n"
            ."Name: {$booking->customer_name}\n"
            ."Email: {$booking->customer_email}\n"
            ."Phone: {$booking->customer_phone}\n"
            ."Date: {$booking->date->format('Y-m-d')}\n"
            ."Time: {$booking->time}\n"
            ."Guests: {$booking->guests}",
            function ($message) use ($booking): void {
                $message->to('info@ratalfoods.ca')
                    ->subject("New Booking {$booking->booking_number}");
            }
        );

        return back()->with([
            'success' => 'Your booking request has been submitted.',
            'bookingNumber' => $booking->booking_number,
        ]);
    }
}
