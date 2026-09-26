<?php

namespace App\Support;

use App\Models\User;

class GuestSignup
{
    /**
     * Whether a confirmation email should invite this person to create an account.
     */
    public static function shouldInvite(?int $userId, string $email): bool
    {
        return $userId === null
            && ! User::query()->whereRaw('lower(email) = ?', [strtolower(trim($email))])->exists();
    }

    /**
     * For guest orders and bookings: remember the details so the signup form can
     * start filled in, and tell the page whether that email already has an account.
     *
     * @return array{has_account: bool}|null
     */
    public static function prompt(?User $user, string $name, string $email): ?array
    {
        if ($user) {
            return null;
        }

        session()->put('signup_prefill', ['name' => $name, 'email' => strtolower(trim($email))]);

        return [
            'has_account' => User::query()->whereRaw('lower(email) = ?', [strtolower(trim($email))])->exists(),
        ];
    }
}
