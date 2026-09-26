<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\RecurringOrder;
use App\Support\RecurringOrderException;
use App\Support\RecurringOrders;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RecurringOrderController extends Controller
{
    public function index(Request $request): Response
    {
        $schedules = RecurringOrder::query()
            ->where('user_id', $request->user()->id)
            ->whereIn('status', [RecurringOrder::ACTIVE, RecurringOrder::PAUSED])
            ->latest()
            ->get();

        $names = Product::query()
            ->whereIn('id', $schedules->flatMap(fn (RecurringOrder $r) => collect($r->items)->pluck('product_id'))->unique())
            ->pluck('name', 'id');

        return Inertia::render('public/dashboard/Recurring', [
            'schedules' => $schedules->map(fn (RecurringOrder $r) => [
                'id' => $r->id,
                'status' => $r->status,
                'frequency_label' => $r->frequencyLabel(),
                'collection_method' => $r->collection_method->value,
                'when' => $r->collection_method->value === 'pickup'
                    ? 'Pickup at '.$r->pickup_slot
                    : 'Delivery at '.CarbonImmutable::createFromFormat('H:i', $r->delivery_slot)->format('g:i A'),
                'address' => $r->delivery_address,
                'items' => collect($r->items)->map(fn (array $item) => [
                    'name' => $names[$item['product_id']] ?? 'Item no longer available',
                    'quantity' => $item['quantity'],
                ])->values(),
                'next_date' => $r->upcomingDate()?->toDateString() ?? ($r->status === RecurringOrder::PAUSED ? $r->next_service_date->toDateString() : null),
                'ends_on' => $r->ends_on?->toDateString(),
                'payment' => 'Pay on '.($r->collection_method->value === 'pickup' ? 'pickup' : 'delivery'),
            ])->values(),
        ]);
    }

    public function pause(Request $request, RecurringOrder $recurring): RedirectResponse
    {
        $this->authorizeOwner($request, $recurring);
        $recurring->update(['status' => RecurringOrder::PAUSED]);

        return back()->with('success', 'Repeat order paused. Resume it any time.');
    }

    public function resume(Request $request, RecurringOrder $recurring): RedirectResponse
    {
        $this->authorizeOwner($request, $recurring);

        // Never create orders for dates that have already passed.
        $next = CarbonImmutable::parse($recurring->next_service_date);
        while ($next->lt(today())) {
            $next = $next->addDays($recurring->intervalDays());
        }

        $recurring->update(['status' => RecurringOrder::ACTIVE, 'next_service_date' => $next->toDateString()]);

        return back()->with('success', 'Repeat order resumed.');
    }

    public function cancel(Request $request, RecurringOrder $recurring): RedirectResponse
    {
        $this->authorizeOwner($request, $recurring);

        try {
            // A repeat order that was already made but not started is cancelled with the schedule.
            if ($date = $recurring->upcomingDate()) {
                RecurringOrders::skip($recurring, $date);
            }
        } catch (RecurringOrderException) {
            // Already being prepared: leave that one, the rest of the schedule is still cancelled.
        }

        $recurring->update(['status' => RecurringOrder::CANCELLED]);

        return back()->with('success', 'Repeat order cancelled.');
    }

    public function skipNext(Request $request, RecurringOrder $recurring): RedirectResponse
    {
        $this->authorizeOwner($request, $recurring);

        $date = $recurring->upcomingDate();

        if (! $date) {
            return back()->with('error', 'There is nothing coming up to skip.');
        }

        try {
            RecurringOrders::skip($recurring, $date);
        } catch (RecurringOrderException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'Skipped '.$date->format('l, F j').'. Your schedule carries on after that.');
    }

    /**
     * Landing page for the signed "Skip this order" link in the reminder email.
     * Nothing happens on a plain visit (email scanners open links); the button confirms.
     */
    public function skipPage(RecurringOrder $recurring, string $date): Response|RedirectResponse
    {
        $day = $this->parseDate($date);

        if (! $day) {
            return redirect()->route('home')->with('error', 'That link is not valid.');
        }

        $order = $recurring->orders()->whereDate('recurring_for', $day->toDateString())->first();

        return Inertia::render('public/RecurringSkip', [
            'date' => $day->toDateString(),
            'date_label' => $day->format('l, F j'),
            'already_skipped' => $recurring->isSkipped($day->toDateString()),
            'order_number' => $order?->order_number,
            'started' => $order !== null && $order->status->value !== 'pending' && $order->status->value !== 'cancelled',
        ]);
    }

    public function skipConfirm(RecurringOrder $recurring, string $date): RedirectResponse
    {
        $day = $this->parseDate($date);

        if (! $day) {
            return redirect()->route('home')->with('error', 'That link is not valid.');
        }

        try {
            RecurringOrders::skip($recurring, $day);
        } catch (RecurringOrderException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'Done. That order is skipped and your schedule carries on.');
    }

    private function authorizeOwner(Request $request, RecurringOrder $recurring): void
    {
        abort_unless($recurring->user_id === $request->user()->id, 404);
    }

    private function parseDate(string $date): ?CarbonImmutable
    {
        return preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) === 1 ? CarbonImmutable::parse($date)->startOfDay() : null;
    }
}
