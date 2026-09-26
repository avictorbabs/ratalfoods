<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LoyaltyTransaction;
use App\Models\StoreSetting;
use App\Models\User;
use App\Support\Loyalty;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LoyaltyController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('q', ''));

        $customers = $search === '' ? collect() : User::query()
            ->where(function ($query) use ($search): void {
                $query->where('email', 'like', "%{$search}%")->orWhere('name', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->limit(8)
            ->get(['id', 'name', 'email'])
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'balance' => Loyalty::balance($user),
                'history' => LoyaltyTransaction::query()->where('user_id', $user->id)->latest('id')->limit(8)->get()
                    ->map(fn (LoyaltyTransaction $transaction) => [
                        'id' => $transaction->id,
                        'label' => $transaction->label(),
                        'points' => $transaction->points,
                        'note' => $transaction->note,
                        'created_at' => $transaction->created_at->toIso8601String(),
                    ]),
            ]);

        return Inertia::render('admin/Loyalty/Index', [
            'settings' => StoreSetting::current()->only([
                'loyalty_enabled', 'loyalty_points_per_dollar', 'loyalty_point_value',
                'loyalty_min_redeem', 'loyalty_max_percent', 'loyalty_expiry_months',
            ]),
            'stats' => [
                'outstanding' => (int) LoyaltyTransaction::query()->spendable()->sum('remaining'),
                'earned' => (int) LoyaltyTransaction::query()->whereIn('type', [LoyaltyTransaction::EARN, LoyaltyTransaction::RESTORE])->sum('points'),
                'redeemed' => (int) abs(LoyaltyTransaction::query()->where('type', LoyaltyTransaction::REDEEM)->sum('points')),
                'members' => LoyaltyTransaction::query()->distinct('user_id')->count('user_id'),
            ],
            'search' => $search,
            'customers' => $customers->values(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'loyalty_enabled' => ['required', 'boolean'],
            'loyalty_points_per_dollar' => ['required', 'numeric', 'min:0.1', 'max:1000'],
            'loyalty_point_value' => ['required', 'numeric', 'min:0.001', 'max:10'],
            'loyalty_min_redeem' => ['required', 'integer', 'min:1', 'max:1000000'],
            'loyalty_max_percent' => ['required', 'integer', 'min:1', 'max:100'],
            'loyalty_expiry_months' => ['nullable', 'integer', 'min:1', 'max:120'],
        ]);

        StoreSetting::current()->update($data);

        return back()->with('success', 'Loyalty settings saved.');
    }

    public function adjust(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'points' => ['required', 'integer', 'not_in:0', 'between:-1000000,1000000'],
            'note' => ['required', 'string', 'max:200'],
        ]);

        Loyalty::adjust(User::query()->findOrFail($data['user_id']), (int) $data['points'], $data['note']);

        return back()->with('success', 'Points updated.');
    }
}
