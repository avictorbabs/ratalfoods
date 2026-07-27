<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreNewsletterRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Mail;

class NewsletterController extends Controller
{
    public function store(StoreNewsletterRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        Mail::raw(
            "New newsletter signup\n\nName: {$validated['name']}\nEmail: {$validated['email']}",
            function ($message) use ($validated): void {
                $message->to('info@ratalfoods.ca')
                    ->replyTo($validated['email'], $validated['name'])
                    ->subject("Newsletter signup — {$validated['name']}");
            }
        );

        return back()->with('success', 'Thanks for subscribing! We will keep you updated.');
    }
}
