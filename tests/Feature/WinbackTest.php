<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Mail\WinbackOffer;
use App\Models\Coupon;
use App\Models\EmailOptOut;
use App\Models\Order;
use App\Models\StoreSetting;
use App\Models\User;
use App\Models\WinbackEmail;
use App\Support\CouponException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class WinbackTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
    }

    private function pastOrder(string $email, int $daysAgo, array $extra = []): Order
    {
        $order = Order::query()->create([
            'customer_name' => 'Wale Winback', 'customer_email' => $email, 'customer_phone' => '555-0100',
            'subtotal' => 30, 'tax' => 3.9, 'delivery_fee' => 0, 'total' => 33.9,
            'collection_method' => 'pickup', 'status' => OrderStatus::Completed, 'payment_status' => 'paid',
            'payment_method' => 'cash_on_delivery', ...$extra,
        ]);

        $order->forceFill(['created_at' => now()->subDays($daysAgo)])->saveQuietly();

        return $order;
    }

    public function test_customers_who_have_been_away_get_a_personal_offer(): void
    {
        $this->pastOrder('wale@example.com', 45);

        $this->artisan('customers:send-winback')->assertSuccessful();

        Mail::assertSent(WinbackOffer::class, fn ($mail) => $mail->hasTo('wale@example.com')
            && $mail->coupon->campaign === 'winback'
            && $mail->coupon->email === 'wale@example.com'
            && (float) $mail->coupon->value === 10.0
            && $mail->coupon->usage_limit === 1);
        $this->assertSame(1, WinbackEmail::query()->count());
    }

    public function test_recent_customers_and_new_visitors_are_left_alone(): void
    {
        $this->pastOrder('recent@example.com', 5);
        $this->pastOrder('mixed@example.com', 60);
        $this->pastOrder('mixed@example.com', 3);

        $this->artisan('customers:send-winback');

        Mail::assertNotSent(WinbackOffer::class);
    }

    public function test_cancelled_and_unpaid_stripe_orders_do_not_count_as_customers(): void
    {
        $this->pastOrder('cancelled@example.com', 60, ['status' => OrderStatus::Cancelled]);
        $this->pastOrder('unpaid@example.com', 60, ['payment_method' => 'stripe', 'payment_status' => 'unpaid', 'status' => OrderStatus::Pending]);

        $this->artisan('customers:send-winback');

        Mail::assertNotSent(WinbackOffer::class);
    }

    public function test_each_person_is_emailed_at_most_once_per_cooldown(): void
    {
        $this->pastOrder('wale@example.com', 45);

        $this->artisan('customers:send-winback');
        $this->artisan('customers:send-winback');

        Mail::assertSent(WinbackOffer::class, 1);

        $this->travel(91)->days();
        $this->artisan('customers:send-winback');

        Mail::assertSent(WinbackOffer::class, 2);
    }

    public function test_unsubscribed_people_and_admins_are_skipped(): void
    {
        $this->pastOrder('nomail@example.com', 45);
        $this->pastOrder('boss@example.com', 45);
        EmailOptOut::query()->create(['email' => 'nomail@example.com']);
        User::factory()->create(['email' => 'boss@example.com', 'role' => UserRole::Admin]);

        $this->artisan('customers:send-winback');

        Mail::assertNotSent(WinbackOffer::class);
    }

    public function test_the_admin_switch_stops_win_back_emails(): void
    {
        StoreSetting::current()->update(['winback_enabled' => false]);
        $this->pastOrder('wale@example.com', 45);

        $this->artisan('customers:send-winback')->assertSuccessful();

        Mail::assertNotSent(WinbackOffer::class);
    }

    public function test_the_offer_code_works_at_checkout_for_that_customer_only(): void
    {
        $this->pastOrder('wale@example.com', 45);
        $this->artisan('customers:send-winback');
        $coupon = Coupon::query()->where('campaign', 'winback')->sole();

        $this->assertNotNull($coupon->expires_at);
        $this->assertFalse($coupon->first_order_only);
        Coupon::resolveForOrder($coupon->code, 30, 'wale@example.com', null);

        $this->expectException(CouponException::class);
        Coupon::resolveForOrder($coupon->code, 30, 'someone-else@example.com', null);
    }

    public function test_the_email_has_a_working_unsubscribe_link_that_records_the_opt_out(): void
    {
        $this->pastOrder('wale@example.com', 45);
        $this->artisan('customers:send-winback');

        $mail = null;
        Mail::assertSent(WinbackOffer::class, function ($sent) use (&$mail) {
            $mail = $sent;

            return true;
        });

        $html = $mail->render();
        $this->assertStringContainsString('unsubscribe', strtolower($html));

        $this->get($mail->unsubscribeUrl())->assertOk()->assertInertia(fn ($page) => $page
            ->component('public/Unsubscribed')
            ->where('email', 'wale@example.com'));

        $this->assertTrue(EmailOptOut::contains('WALE@example.com'));
    }

    public function test_an_unsigned_or_tampered_unsubscribe_link_is_turned_away_politely(): void
    {
        $this->get('/unsubscribe/wale@example.com')->assertForbidden();

        $signed = URL::signedRoute('unsubscribe', ['email' => 'wale@example.com']);
        $this->get(str_replace('wale@example.com', 'other@example.com', $signed))->assertForbidden();

        $this->assertSame(0, EmailOptOut::query()->count());
    }

    public function test_subscribing_again_lifts_an_earlier_unsubscribe(): void
    {
        EmailOptOut::query()->create(['email' => 'wale@example.com']);

        $this->post('/newsletter', ['name' => 'Wale', 'email' => 'Wale@example.com']);

        $this->assertFalse(EmailOptOut::contains('wale@example.com'));
    }

    public function test_admin_can_save_win_back_settings_and_win_back_codes_stay_out_of_the_promo_list(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $this->pastOrder('wale@example.com', 45);
        $this->artisan('customers:send-winback');

        $this->actingAs($admin)->put('/admin/coupons/winback', [
            'winback_enabled' => true, 'winback_days_inactive' => 21, 'winback_discount_percent' => 15, 'winback_valid_days' => 10,
        ])->assertSessionHasNoErrors();

        $this->assertSame(21, StoreSetting::current()->winback_days_inactive);

        $this->put('/admin/coupons/winback', [
            'winback_enabled' => true, 'winback_days_inactive' => 1, 'winback_discount_percent' => 15, 'winback_valid_days' => 10,
        ])->assertSessionHasErrors('winback_days_inactive');

        $this->get('/admin/coupons')->assertInertia(fn ($page) => $page
            ->has('coupons', 0)
            ->where('winbackStats.sent', 1)
            ->where('winback.winback_days_inactive', 21));
    }
}
