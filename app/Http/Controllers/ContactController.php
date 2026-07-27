<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreContactRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    public function store(StoreContactRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $type = $validated['type'] ?? 'general';

        $subject = $type === 'delivery'
            ? "Delivery Request from {$validated['name']}"
            : "Contact from {$validated['name']}";

        $body = $type === 'delivery'
            ? "Name: {$validated['name']}\nEmail: {$validated['email']}\nPhone: ".($validated['phone'] ?? 'N/A')."\nAddress: ".($validated['address'] ?? 'N/A')."\nPreferred Time: ".($validated['preferred_time'] ?? 'N/A')."\nMessage: {$validated['message']}"
            : "Name: {$validated['name']}\nEmail: {$validated['email']}\nPhone: ".($validated['phone'] ?? 'N/A')."\nMessage: {$validated['message']}";

        Mail::raw($body, function ($message) use ($validated, $subject): void {
            $message->to('info@ratalfoods.ca')
                ->replyTo($validated['email'], $validated['name'])
                ->subject($subject);
        });

        $successMessage = $type === 'delivery'
            ? 'Your delivery request has been sent. We will get back to you shortly.'
            : 'Thank you for your message. We will get back to you soon.';

        return back()->with('success', $successMessage);
    }
}
