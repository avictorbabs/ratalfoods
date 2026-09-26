<?php

namespace App\Http\Controllers;

use App\Actions\SendOrderNotifications;
use App\Http\Requests\StoreNewsletterRequest;
use App\Mail\NewsletterSignupReceived;
use App\Mail\WelcomeCoupon;
use App\Models\Coupon;
use App\Models\EmailOptOut;
use App\Models\NewsletterSubscriber;
use App\Models\StoreSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class NewsletterController extends Controller
{
    public function store(StoreNewsletterRequest $request): RedirectResponse
    {
        $validated = $request->safe()->except('recaptcha');
        $email = strtolower(trim($validated['email']));

        $subscriber = NewsletterSubscriber::query()->firstOrCreate(
            ['email' => $email],
            ['name' => $validated['name'], 'subscribed_at' => now()],
        );

        // Subscribing is a fresh, explicit yes, so it lifts any earlier unsubscribe.
        EmailOptOut::query()->where('email', $email)->delete();

        $settings = StoreSetting::current();

        // Anyone who has ordered before is not a "first order" customer, so no welcome code.
        $coupon = $settings->welcome_offer_enabled && ! Coupon::hasPreviousOrder($email, null)
            ? Coupon::issueWelcome($subscriber, $settings)
            : null;

        defer(function () use ($validated, $coupon, $subscriber): void {
            try {
                Mail::to(SendOrderNotifications::storeRecipients())
                    ->send(new NewsletterSignupReceived($validated['name'], $validated['email']));

                if ($coupon) {
                    Mail::to($subscriber->email, $subscriber->name)->send(new WelcomeCoupon($subscriber->name, $coupon));
                }
            } catch (Throwable $exception) {
                Log::error('Could not send newsletter signup email', [
                    'email' => $validated['email'] ?? null,
                    'error' => $exception->getMessage(),
                ]);
                report($exception);
            }
        });

        return back()->with(
            'success',
            $coupon
                ? 'Thanks for subscribing! Your welcome code is on its way to your inbox.'
                : 'Thanks for subscribing! We will keep you updated.',
        );
    }
}
