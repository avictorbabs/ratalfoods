<?php

namespace Tests\Feature;

use App\Mail\BookingConfirmation;
use App\Mail\OrderConfirmation;
use App\Models\Booking;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class GuestAccountLinkingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
        config(['mail.order_notifications' => ['owner@example.com']]);
    }

    private function orderPayload(string $email, string $name = 'Gina Guest'): array
    {
        $product = Product::query()->firstOrCreate(
            ['name' => 'Jollof'],
            ['price' => 20, 'category' => 'Mains', 'is_active' => true],
        );

        return [
            'customer_name' => $name, 'customer_email' => $email, 'customer_phone' => '555-0100',
            'collection_method' => 'pickup', 'pickup_date' => now()->addDay()->toDateString(), 'pickup_time' => '4:00 PM',
            'payment_method' => 'cash_on_delivery', 'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ];
    }

    private function guestOrder(string $email = 'guest@example.com'): Order
    {
        $this->post('/orders', $this->orderPayload($email));

        return Order::query()->latest('id')->firstOrFail();
    }

    private function guestBooking(string $email = 'guest@example.com'): Booking
    {
        $this->post('/bookings', [
            'customer_name' => 'Gina Guest', 'customer_email' => $email, 'customer_phone' => '555-0100',
            'booking_type' => 'dine_in', 'date' => now()->addDays(2)->toDateString(), 'time' => '6:00 PM', 'guests' => 2, 'occasion' => 'Birthday',
        ]);

        return Booking::query()->latest('id')->firstOrFail();
    }

    private function register(string $email = 'guest@example.com'): User
    {
        $this->post('/register', [
            'name' => 'Gina', 'email' => $email, 'password' => 'password', 'password_confirmation' => 'password',
        ])->assertRedirect(route('verification.notice', absolute: false));

        return User::query()->where('email', $email)->firstOrFail();
    }

    private function verify(User $user): void
    {
        $url = URL::temporarySignedRoute('verification.verify', now()->addHour(), [
            'id' => $user->id, 'hash' => sha1($user->email),
        ]);

        $this->actingAs($user)->get($url)->assertRedirect();
    }

    public function test_registration_sends_a_verification_email_and_blocks_the_dashboard_until_verified(): void
    {
        Notification::fake();

        $user = $this->register();

        Notification::assertSentTo($user, VerifyEmail::class);
        $this->get('/dashboard')->assertRedirect(route('verification.notice'));
        $this->get('/dashboard/orders')->assertRedirect(route('verification.notice'));
    }

    public function test_guest_orders_and_bookings_stay_hidden_until_the_email_is_verified(): void
    {
        $order = $this->guestOrder();
        $booking = $this->guestBooking();

        $this->register();

        $this->assertNull($order->fresh()->user_id);
        $this->assertNull($booking->fresh()->user_id);
    }

    public function test_verifying_the_email_links_past_orders_and_bookings_case_insensitively(): void
    {
        $order = $this->guestOrder('Guest@Example.com');
        $booking = $this->guestBooking();
        $other = $this->guestOrder('someone-else@example.com');

        $user = $this->register();
        $this->verify($user);

        $this->assertSame($user->id, $order->fresh()->user_id);
        $this->assertSame($user->id, $booking->fresh()->user_id);
        $this->assertNull($other->fresh()->user_id);

        $this->get('/dashboard')->assertOk()->assertInertia(fn ($page) => $page->where('orderCount', 1)->where('bookingCount', 1));
    }

    public function test_a_verified_customer_gets_later_guest_orders_linked_at_login(): void
    {
        $user = User::factory()->create(['email' => 'guest@example.com']);
        $order = $this->guestOrder();

        $this->assertNull($order->fresh()->user_id);

        $this->post('/login', ['email' => 'guest@example.com', 'password' => 'password']);

        $this->assertSame($user->id, $order->fresh()->user_id);
    }

    public function test_verified_event_for_an_unverified_user_links_nothing(): void
    {
        $order = $this->guestOrder();
        $user = User::factory()->unverified()->create(['email' => 'guest@example.com']);

        event(new Verified($user));

        $this->assertNull($order->fresh()->user_id);
    }

    public function test_guests_are_invited_to_sign_up_after_ordering_and_booking(): void
    {
        $this->guestOrder();

        $this->get('/checkout')->assertInertia(fn ($page) => $page
            ->where('flash.orderComplete.guest_signup.has_account', false));

        $this->get('/register')->assertInertia(fn ($page) => $page
            ->where('prefill.email', 'guest@example.com')
            ->where('prefill.name', 'Gina Guest'));
    }

    public function test_the_prompt_says_log_in_when_the_email_already_has_an_account(): void
    {
        User::factory()->create(['email' => 'guest@example.com']);

        $this->guestBooking();

        $this->get('/bookings')->assertInertia(fn ($page) => $page->where('flash.guestSignup.has_account', true));
    }

    public function test_signed_in_customers_are_not_asked_to_sign_up(): void
    {
        $this->actingAs(User::factory()->create());

        $this->post('/orders', $this->orderPayload('a@example.com'));

        $this->get('/checkout')->assertInertia(fn ($page) => $page->where('flash.orderComplete.guest_signup', null));
    }

    public function test_confirmation_emails_invite_guests_but_not_existing_customers(): void
    {
        $order = $this->guestOrder();
        $booking = $this->guestBooking();

        $this->assertStringContainsString('Create my account', (new OrderConfirmation($order))->render());
        $this->assertStringContainsString('Create my account', (new BookingConfirmation($booking))->render());

        User::factory()->create(['email' => 'guest@example.com']);

        $this->assertStringNotContainsString('Create my account', (new OrderConfirmation($order))->render());
        $this->assertStringNotContainsString('Create my account', (new BookingConfirmation($booking))->render());
    }
}
