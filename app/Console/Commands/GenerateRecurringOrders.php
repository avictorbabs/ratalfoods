<?php

namespace App\Console\Commands;

use App\Models\RecurringOrder;
use App\Support\RecurringOrders;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Throwable;

class GenerateRecurringOrders extends Command
{
    protected $signature = 'recurring:generate';

    protected $description = 'Create the upcoming orders for repeat schedules and email customers a skip link.';

    public function handle(): int
    {
        $created = 0;
        $horizon = CarbonImmutable::today()->addDays((int) config('marketing.recurring_lead_days'));

        RecurringOrder::query()
            ->where('status', RecurringOrder::ACTIVE)
            ->whereDate('next_service_date', '<=', $horizon->toDateString())
            ->each(function (RecurringOrder $recurring) use (&$created): void {
                try {
                    $created += RecurringOrders::process($recurring);
                } catch (Throwable $exception) {
                    // A broken schedule must not stop the others.
                    report($exception);
                }
            });

        $this->info("Created {$created} repeat order(s).");

        return self::SUCCESS;
    }
}
