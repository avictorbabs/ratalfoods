<?php

namespace App\Http\Controllers;

use App\Actions\SendOrderNotifications;
use App\Http\Requests\StoreContactRequest;
use App\Mail\ContactMessageReceived;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class ContactController extends Controller
{
    public function store(StoreContactRequest $request): RedirectResponse
    {
        $validated = $request->safe()->except('recaptcha');
        $type = $validated['type'] ?? 'general';

        defer(function () use ($validated): void {
            try {
                Mail::to(SendOrderNotifications::storeRecipients())
                    ->send(new ContactMessageReceived($validated));
            } catch (Throwable $exception) {
                Log::error('Could not send contact message email', [
                    'email' => $validated['email'] ?? null,
                    'error' => $exception->getMessage(),
                ]);
                report($exception);
            }
        });

        $successMessage = $type === 'delivery'
            ? 'Your delivery request has been sent. We will get back to you shortly.'
            : 'Thank you for your message. We will get back to you soon.';

        return back()->with('success', $successMessage);
    }
}
