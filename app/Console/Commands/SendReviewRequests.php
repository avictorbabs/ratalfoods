<?php

namespace App\Console\Commands;

use App\Enums\OrderStatus;
use App\Mail\ReviewRequest;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductReview;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendReviewRequests extends Command
{
    protected $signature = 'orders:send-review-requests';

    protected $description = 'Ask customers to review the dishes from orders that were completed a few days ago.';

    public function handle(): int
    {
        $sent = 0;

        Order::query()
            ->whereIn('status', [OrderStatus::Completed->value, OrderStatus::Delivered->value])
            ->whereNull('review_requested_at')
            ->whereNotNull('completed_at')
            ->where('completed_at', '<=', now()->subDays((int) config('marketing.review_request_delay_days')))
            ->where('completed_at', '>=', now()->subDays((int) config('marketing.review_request_max_age_days')))
            ->with('items')
            ->each(function (Order $order) use (&$sent): void {
                $reviewed = ProductReview::query()
                    ->whereRaw('lower(customer_email) = ?', [strtolower($order->customer_email)])
                    ->pluck('product_id');

                $products = Product::query()
                    ->whereIn('id', $order->items->pluck('product_id')->filter())
                    ->whereNotIn('id', $reviewed)
                    ->where('is_active', true)
                    ->limit(5)
                    ->get();

                $order->forceFill(['review_requested_at' => now()])->save();

                if ($products->isEmpty()) {
                    return;
                }

                try {
                    Mail::to($order->customer_email, $order->customer_name)->send(new ReviewRequest($order, $products));
                    $sent++;
                } catch (Throwable $exception) {
                    report($exception);
                }
            });

        $this->info("Sent {$sent} review request(s).");

        return self::SUCCESS;
    }
}
