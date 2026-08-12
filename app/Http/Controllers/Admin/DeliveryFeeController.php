<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DeliveryFeeRequest;
use App\Models\DeliveryFee;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DeliveryFeeController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        $fees = DeliveryFee::query()
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('match_terms', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/DeliveryFees/Index', [
            'fees' => $fees,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(DeliveryFeeRequest $request): RedirectResponse
    {
        DeliveryFee::query()->create($request->feeAttributes());

        return back()->with('success', 'Delivery fee zone created.');
    }

    public function update(DeliveryFeeRequest $request, DeliveryFee $deliveryFee): RedirectResponse
    {
        $deliveryFee->update($request->feeAttributes());

        return back()->with('success', 'Delivery fee zone updated.');
    }

    public function destroy(DeliveryFee $deliveryFee): RedirectResponse
    {
        $deliveryFee->delete();

        return back()->with('success', 'Delivery fee zone deleted.');
    }
}
