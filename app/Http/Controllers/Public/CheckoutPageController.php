<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\DeliveryFee;
use App\Models\StoreSetting;
use App\Support\PickupInfo;
use App\Support\PickupLeadTime;
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
            'deliveryFeeEnabled' => (bool) StoreSetting::current()->delivery_fee_enabled,
            'stripeEnabled' => filled(config('services.stripe.secret')),
            'pickupInfo' => PickupInfo::resolve(),
            'earliestPickup' => PickupLeadTime::window(),
            'quickPickup' => PickupLeadTime::window(0),
        ]);
    }
}
