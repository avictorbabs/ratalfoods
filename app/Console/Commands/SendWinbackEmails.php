<?php

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Mail\WinbackOffer;
use App\Models\Coupon;
use App\Models\EmailOptOut;
use App\Models\Order;
use App\Models\StoreSetting;
use App\Models\User;
use App\Models\WinbackEmail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendWinbackEmails extends Command
{
    protected $signature = 'customers:send-winback';

    protected $description = 'Email past customers who have not ordered for a while with a small personal offer.';

    /** Do not send the same person another win-back email for this many days. */
    private const COOLDOWN_DAYS = 90;

    public function handle(): int
    {
        $settings = StoreSetting::current();

        if (! $settings->winback_enabled) {
            $this->info('Win-back emails are switched off.');

            return self::SUCCESS;
        }

        $cutoff = now()->subDays(max(1, (int) $settings->winback_days_inactive));

        // Latest real order per email address; only people whose latest order is old enough.
        $candidates = Order::query()
            ->countingPurchases()
            ->whereNotNull('customer_email')
            ->select('customer_email', DB::raw('max(created_at) as last_order_at'), DB::raw('max(customer_name) as customer_name'))
            ->groupBy('customer_email')
            ->havingRaw('max(created_at) <= ?', [$cutoff])
            ->get();

        $adminEmails = User::query()->where('role', UserRole::Admin->value)->pluck('email')->map(fn ($e) => strtolower($e))->all();
        $sent = 0;

        foreach ($candidates as $candidate) {
            $email = strtolower(trim($candidate->customer_email));

            if ($email === '' || in_array($email, $adminEmails, true) || EmailOptOut::contains($email)) {
                continue;
            }

            $recentlySent = WinbackEmail::query()
                ->where('email', $email)
                ->where('sent_at', '>', now()->subDays(self::COOLDOWN_DAYS))
                ->exists();

            // A later order under a differently-cased address counts as coming back.
            $orderedSince = Order::query()
                ->countingPurchases()
                ->whereRaw('lower(customer_email) = ?', [$email])
                ->where('created_at', '>', $cutoff)
                ->exists();

            if ($recentlySent || $orderedSince) {
                continue;
            }

            $coupon = null;

            try {
                $coupon = Coupon::issueWinback($email, $settings);

                Mail::to($email, $candidate->customer_name)->send(new WinbackOffer($candidate->customer_name, $email, $coupon));

                WinbackEmail::query()->create(['email' => $email, 'coupon_id' => $coupon->id, 'sent_at' => now()]);
                $sent++;
            } catch (Throwable $exception) {
                // One bad address must not stop everyone else. The unused code is removed so it cannot pile up.
                if ($coupon) {
                    $coupon->delete();
                }

                report($exception);
            }
        }

        $this->info("Sent {$sent} win-back email(s).");

        return self::SUCCESS;
    }
}
