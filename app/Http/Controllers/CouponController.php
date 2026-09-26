<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use App\Models\Product;
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
        ]);

        $products = Product::query()
            ->whereIn('id', collect($data['items'])->pluck('product_id'))
            ->where('is_active', true)
            ->get()
            ->keyBy('id');

        $subtotal = collect($data['items'])->sum(
            fn (array $item) => ($products->get($item['product_id'])?->effectivePrice() ?? 0) * (int) $item['quantity']
        );

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
