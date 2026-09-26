<?php

namespace App\Http\Controllers;

use App\Models\AbandonedCart;
use App\Support\CartLines;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AbandonedCartController extends Controller
{
    /**
     * Remember a cart once the shopper has typed their email at checkout, so we
     * can send a reminder if they never finish the order.
     */
    public function capture(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'name' => ['nullable', 'string', 'max:255'],
            'items' => ['present', 'array', 'max:50'],
            'items.*.product_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
        ]);

        $email = strtolower(trim($data['email']));

        if ($data['items'] === []) {
            AbandonedCart::query()->where('email', $email)->delete();

            return response()->json(['ok' => true]);
        }

        $cart = AbandonedCart::query()->firstOrNew(['email' => $email]);

        // A cart that already got its reminder starts a new cycle only after a few days.
        $resetReminder = ! $cart->exists
            || $cart->reminder_sent_at === null
            || $cart->reminder_sent_at->lt(now()->subDays(3));

        $cart->fill([
            'name' => $data['name'] ?? $cart->name,
            'user_id' => $request->user()?->id,
            'items' => collect($data['items'])
                ->map(fn (array $item) => ['product_id' => (int) $item['product_id'], 'quantity' => (int) $item['quantity']])
                ->values()
                ->all(),
            'token' => $cart->token ?: Str::random(48),
            'last_activity_at' => now(),
            'reminder_sent_at' => $resetReminder ? null : $cart->reminder_sent_at,
        ])->save();

        return response()->json(['ok' => true]);
    }

    public function recover(string $token): RedirectResponse
    {
        $cart = AbandonedCart::query()->where('token', $token)->first();

        if (! $cart) {
            return redirect()->route('menu.index');
        }

        $resolved = CartLines::resolve($cart->items);

        if ($resolved['lines'] === []) {
            return redirect()->route('menu.index')->with('error', 'Sorry, the items in your cart are no longer available.');
        }

        return redirect()->route('checkout')->with('recoveredCart', [
            'items' => $resolved['lines'],
            'email' => $cart->email,
            'unavailable' => $resolved['unavailable'],
        ]);
    }
}
