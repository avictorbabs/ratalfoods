<?php

use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'stripe/webhook',
        ]);

        $middleware->alias([
            'admin' => EnsureUserIsAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Unhandled 500-level errors on an Inertia request (e.g. a form save
        // that crashes on the server) would otherwise render a raw Laravel
        // error page inside the SPA. Turn those into a normal redirect back
        // with a flash message instead, so the page shows a friendly toast.
        // The exception is still reported/logged by the framework before
        // this callback runs. Validation, auth, and 404-style exceptions
        // (all < 500) are left alone so Laravel/Inertia keep handling them
        // as usual (inline field errors, redirect to login, etc.). These
        // two don't implement HttpExceptionInterface, so they need an
        // explicit exclusion; everything else (ModelNotFoundException,
        // AuthorizationException, etc.) is already normalized into an
        // HttpException with the right status before this callback runs.
        $exceptions->render(function (Throwable $e, Request $request) {
            $isInertia = (bool) $request->header('X-Inertia');
            $wantsJson = $request->expectsJson() && ! $isInertia;

            if (! $isInertia && ! $wantsJson) {
                return null;
            }

            if ($e instanceof ValidationException || $e instanceof AuthenticationException) {
                return null;
            }

            $status = $e instanceof HttpExceptionInterface ? $e->getStatusCode() : 500;

            // Problems caused by the request (a wrong method, an expired session, a
            // missing page...) get a plain-English message instead of a raw error.
            $friendly = [
                400 => 'That request could not be processed. Please try again.',
                403 => 'You do not have permission to do that.',
                404 => 'We could not find what you were looking for.',
                405 => 'That action is not available right now. Please try again.',
                419 => 'Your session expired. Please try again.',
                429 => 'Too many attempts. Please wait a moment and try again.',
            ];

            if ($status < 500 && ! isset($friendly[$status])) {
                return null;
            }

            // Server errors are logged by the framework before this runs. The visitor
            // only ever sees a calm message, never the exception text.
            $message = $friendly[$status] ?? 'Something went wrong on our side. Please try again in a moment.';

            if ($wantsJson) {
                return response()->json(['message' => $message], $status);
            }

            return redirect()->back()->with('error', $message);
        });
    })->create();
