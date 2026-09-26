<?php

namespace App\Console\Commands;

use App\Support\Loyalty;
use Illuminate\Console\Command;
use Throwable;

class ExpireLoyaltyPoints extends Command
{
    protected $signature = 'loyalty:expire';

    protected $description = 'Remove loyalty points that have passed their expiry date.';

    public function handle(): int
    {
        try {
            $expired = Loyalty::expireDue();
        } catch (Throwable $exception) {
            report($exception);
            $this->error('Could not expire loyalty points. See the log for details.');

            return self::FAILURE;
        }

        $this->info("Expired {$expired} point(s).");

        return self::SUCCESS;
    }
}
