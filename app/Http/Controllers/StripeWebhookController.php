<?php

namespace App\Http\Controllers;

use App\Actions\ConfirmStripePayment;
use App\Actions\HandleStripeOrderEvents;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Checkout\Session as StripeSession;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;
use UnexpectedValueException;

class StripeWebhookController extends Controller
{
    public function __invoke(Request $request, ConfirmStripePayment $confirmPayment, HandleStripeOrderEvents $events): JsonResponse
    {
        $secret = config('services.stripe.webhook_secret');

        if (! is_string($secret) || $secret === '') {
            Log::warning('Stripe webhook received but STRIPE_WEBHOOK_SECRET is not set.');

            return response()->json(['error' => 'Webhook not configured'], 500);
        }

        try {
            $event = Webhook::constructEvent(
                $request->getContent(),
                (string) $request->header('Stripe-Signature'),
                $secret,
            );
        } catch (UnexpectedValueException|SignatureVerificationException) {
            return response()->json(['error' => 'Invalid payload'], 400);
        }

        $object = $event->data->object;

        match ($event->type) {
            'checkout.session.completed',
            'checkout.session.async_payment_succeeded' => $object instanceof StripeSession
                ? $confirmPayment->handle($object)
                : null,
            'checkout.session.expired',
            'checkout.session.async_payment_failed' => $events->cancelUnpaid($object),
            'charge.refunded' => $events->recordRefund($object),
            'charge.dispute.created' => $events->recordDispute($object),
            default => null,
        };

        return response()->json(['received' => true]);
    }
}
