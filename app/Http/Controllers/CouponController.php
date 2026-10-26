<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use App\Support\CartLines;
use App\Support\CouponException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    /**
     * Check a coupon against the current cart so the checkout can show the saving
     * before the order is placed. The order itself re-validates everything.
     */
    public function validateCode(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:64'],
            'email' => ['nullable', 'email', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
            'items.*.variants' => ['nullable', 'array'],
            'items.*.variants.*' => ['nullable', 'string', 'max:100'],
            'items.*.addons' => ['nullable', 'array', 'max:30'],
            'items.*.addons.*.key' => ['required_with:items.*.addons', 'string', 'max:100'],
            'items.*.addons.*.quantity' => ['required_with:items.*.addons', 'integer', 'min:0', 'max:99'],
        ]);

        // Same pricing as the order itself, including chosen options and add-ons.
        $subtotal = collect(CartLines::resolve($data['items'])['lines'])->sum(fn (array $line) => $line['price'] * $line['quantity']);

        try {
            $coupon = Coupon::resolveForOrder(
                $data['code'],
                (float) $subtotal,
                (string) ($data['email'] ?? ''),
                $request->user()?->id,
            );
        } catch (CouponException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json([
            'code' => $coupon->code,
            'description' => $coupon->description(),
            'discount' => $coupon->discountFor((float) $subtotal),
        ]);
    }
}
