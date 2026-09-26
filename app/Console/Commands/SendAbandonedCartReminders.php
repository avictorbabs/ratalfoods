<?php

namespace App\Console\Commands;

use App\Mail\AbandonedCartReminder;
use App\Models\AbandonedCart;
use App\Support\CartLines;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendAbandonedCartReminders extends Command
{
    protected $signature = 'carts:send-reminders';

    protected $description = 'Email shoppers who left items in their cart at checkout (one reminder per cart).';

    public function handle(): int
    {
        $sent = 0;

        AbandonedCart::query()
            ->whereNull('reminder_sent_at')
            ->where('last_activity_at', '<=', now()->subMinutes((int) config('marketing.abandoned_cart_delay_minutes')))
            ->where('last_activity_at', '>=', now()->subHours((int) config('marketing.abandoned_cart_max_age_hours')))
            ->each(function (AbandonedCart $cart) use (&$sent): void {
                $resolved = CartLines::resolve($cart->items);

                if ($resolved['lines'] === []) {
                    $cart->delete();

                    return;
                }

                try {
                    Mail::to($cart->email, $cart->name)->send(new AbandonedCartReminder($cart, $resolved['lines']));
                    $cart->forceFill(['reminder_sent_at' => now()])->save();
                    $sent++;
                } catch (Throwable $exception) {
                    report($exception);
                }
            });

        $this->info("Sent {$sent} abandoned cart reminder(s).");

        return self::SUCCESS;
    }
}
