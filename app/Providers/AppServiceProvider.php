<?php

namespace App\Providers;

use App\Listeners\LinkGuestRecords;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Verified;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Event::listen([Verified::class, Login::class], LinkGuestRecords::class);

        VerifyEmail::toMailUsing(function (object $notifiable, string $url): MailMessage {
            $firstName = explode(' ', trim($notifiable->name))[0];

            return (new MailMessage)
                ->subject('Please verify your email')
                ->greeting("Hello {$firstName},")
                ->line('Welcome to Ratal Foods! Please confirm your email address to finish setting up your account.')
                ->line('Once confirmed, any orders or bookings you made with this email will appear in your dashboard.')
                ->action('Verify Email Address', $url)
                ->line('If you did not create an account, no further action is required.')
                ->salutation('Warm regards, Ratal Foods');
        });

        ResetPassword::toMailUsing(function (object $notifiable, string $token): MailMessage {
            $firstName = explode(' ', trim($notifiable->name))[0];
            $url = URL::route('password.reset', ['token' => $token, 'email' => $notifiable->getEmailForPasswordReset()]);
            $minutes = Config::get('auth.passwords.'.Config::get('auth.defaults.passwords').'.expire');

            return (new MailMessage)
                ->subject('Reset your password')
                ->greeting("Hello {$firstName},")
                ->line('We received a request to reset the password for your Ratal Foods account.')
                ->action('Reset Password', $url)
                ->line("This link expires in {$minutes} minutes.")
                ->line('If you did not request a password reset, no further action is required.')
                ->salutation('Warm regards, Ratal Foods');
        });
    }
}
