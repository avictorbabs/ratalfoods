<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class Recaptcha implements ValidationRule
{
    // Run even when the field is missing or empty.
    public bool $implicit = true;

    /**
     * Verify a Google reCAPTCHA v2 token. When no secret key is configured
     * (local dev, tests) the check is skipped.
     */
    public static function enabled(): bool
    {
        return filled(config('services.recaptcha.secret_key'));
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! self::enabled()) {
            return;
        }

        if (! is_string($value) || $value === '') {
            $fail('Please confirm that you are not a robot.');

            return;
        }

        try {
            $response = Http::asForm()->timeout(8)->post('https://www.google.com/recaptcha/api/siteverify', [
                'secret' => config('services.recaptcha.secret_key'),
                'response' => $value,
                'remoteip' => request()->ip(),
            ]);

            if ($response->json('success') === true) {
                return;
            }

            Log::info('reCAPTCHA verification rejected', ['errors' => $response->json('error-codes')]);
            $fail('The reCAPTCHA verification failed. Please try again.');
        } catch (Throwable $exception) {
            report($exception);
            $fail('We could not verify the reCAPTCHA. Please try again.');
        }
    }
}
