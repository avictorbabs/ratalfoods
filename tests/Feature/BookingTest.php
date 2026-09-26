<?php

namespace Tests\Feature;

use App\Mail\BookingConfirmation;
use App\Mail\NewBookingReceived;
use App\Models\Booking;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class BookingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['mail.order_notifications' => ['info@ratalfoods.ca']]);
    }

    private function payload(array $overrides = []): array
    {
        return [
            'customer_name' => 'Ada Lovelace',
            'customer_email' => 'ada@example.com',
            'customer_phone' => '555-0100',
            'booking_type' => 'dine_in',
            'date' => now()->addDay()->toDateString(),
            'time' => '6:00 PM',
            'guests' => 4,
            'occasion' => 'Birthday',
            ...$overrides,
        ];
    }

    public function test_dine_in_requires_a_table_count()
    {
        Mail::fake();

        $payload = $this->payload();
        unset($payload['guests']);

        $response = $this->post('/bookings', $payload);

        $response->assertSessionHasErrors('guests');
        $this->assertDatabaseCount('bookings', 0);
    }

    public function test_private_event_requires_a_guest_count()
    {
        Mail::fake();

        $payload = $this->payload(['booking_type' => 'private_event']);
        unset($payload['guests']);

        $response = $this->post('/bookings', $payload);

        $response->assertSessionHasErrors('guests');
        $this->assertDatabaseCount('bookings', 0);
    }

    public function test_catering_does_not_require_a_guest_count()
    {
        Mail::fake();

        $payload = $this->payload(['booking_type' => 'catering']);
        unset($payload['guests']);

        $response = $this->post('/bookings', $payload);

        $response->assertSessionDoesntHaveErrors('guests');
        $this->assertDatabaseCount('bookings', 1);
    }

    public function test_phone_and_occasion_are_required()
    {
        Mail::fake();

        $payload = $this->payload();
        unset($payload['customer_phone'], $payload['occasion']);

        $response = $this->post('/bookings', $payload);

        $response->assertSessionHasErrors(['customer_phone', 'occasion']);
        $this->assertDatabaseCount('bookings', 0);
    }

    public function test_notes_remains_optional()
    {
        Mail::fake();

        $response = $this->post('/bookings', $this->payload());

        $response->assertSessionDoesntHaveErrors('notes');
        $this->assertDatabaseCount('bookings', 1);
    }

    public function test_a_confirmed_booking_emails_the_customer_and_the_store()
    {
        Mail::fake();

        $this->post('/bookings', $this->payload());

        $booking = Booking::query()->sole();

        Mail::assertSent(BookingConfirmation::class, fn ($mail) => $mail->hasTo('ada@example.com') && $mail->booking->is($booking));
        Mail::assertSent(NewBookingReceived::class, fn ($mail) => $mail->hasTo('info@ratalfoods.ca') && $mail->hasReplyTo('ada@example.com'));
    }

    public function test_catering_booking_has_no_party_size_line()
    {
        Mail::fake();

        $payload = $this->payload(['booking_type' => 'catering']);
        unset($payload['guests']);

        $this->post('/bookings', $payload);

        $booking = Booking::query()->sole();

        $this->assertNull($booking->partySizeLine());
    }

    public function test_dine_in_and_private_event_have_a_party_size_line()
    {
        $dineIn = Booking::query()->forceCreate([
            'customer_name' => 'Ada',
            'customer_email' => 'ada@example.com',
            'booking_type' => 'dine_in',
            'date' => now()->addDay(),
            'time' => '6:00 PM',
            'guests' => 5,
        ]);

        $privateEvent = Booking::query()->forceCreate([
            'customer_name' => 'Ada',
            'customer_email' => 'ada@example.com',
            'booking_type' => 'private_event',
            'date' => now()->addDay(),
            'time' => '6:00 PM',
            'guests' => 40,
        ]);

        $this->assertSame('Tables: 5', $dineIn->partySizeLine());
        $this->assertSame('Guests: 40', $privateEvent->partySizeLine());
    }
}
