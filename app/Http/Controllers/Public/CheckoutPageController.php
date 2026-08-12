<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\DeliveryFee;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutPageController extends Controller
{
    public function __invoke(): Response
    {
        $deliveryFees = DeliveryFee::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'match_terms', 'fee']);

        return Inertia::render('public/Checkout', [
            'deliveryFees' => $deliveryFees,
        ]);
    }
}
