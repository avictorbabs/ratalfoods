<?php

namespace App\Http\Controllers;

use App\Models\EmailOptOut;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UnsubscribeController extends Controller
{
    /**
     * Reached from the link in marketing emails (the URL is signed, so it only works
     * for the address the email was sent to).
     */
    public function __invoke(Request $request, string $email): Response
    {
        $email = EmailOptOut::normalize($email);

        EmailOptOut::query()->firstOrCreate(['email' => $email]);

        return Inertia::render('public/Unsubscribed', ['email' => $email]);
    }
}
