<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RecaptchaTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $extra = []): array
    {
        return [
            'name' => 'Ada Obi',
            'email' => 'ada@example.com',
            'message' => 'Hello there',
            ...$extra,
        ];
    }

    public function test_skipped_when_no_secret_is_configured(): void
    {
        config(['services.recaptcha.secret_key' => null]);

        $this->post('/contact', $this->payload())->assertSessionHasNoErrors();
    }

    public function test_missing_token_is_rejected_when_enabled(): void
    {
        config(['services.recaptcha.secret_key' => 'secret']);
        Http::fake();

        $this->post('/contact', $this->payload())->assertSessionHasErrors('recaptcha');
        Http::assertNothingSent();
    }

    public function test_failed_verification_is_rejected(): void
    {
        config(['services.recaptcha.secret_key' => 'secret']);
        Http::fake(['www.google.com/*' => Http::response(['success' => false, 'error-codes' => ['invalid-input-response']])]);

        $this->post('/contact', $this->payload(['recaptcha' => 'bad']))->assertSessionHasErrors('recaptcha');
    }

    public function test_valid_token_passes_on_login_and_contact(): void
    {
        config(['services.recaptcha.secret_key' => 'secret']);
        Http::fake(['www.google.com/*' => Http::response(['success' => true])]);

        $this->post('/contact', $this->payload(['recaptcha' => 'good']))->assertSessionHasNoErrors();
        $this->post('/login', ['email' => 'x@example.com', 'password' => 'nope', 'recaptcha' => 'good'])
            ->assertSessionHasErrors('email')
            ->assertSessionDoesntHaveErrors('recaptcha');
    }
}
