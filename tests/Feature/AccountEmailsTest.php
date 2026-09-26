<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountEmailsTest extends TestCase
{
    use RefreshDatabase;

    public function test_verification_email_greets_the_customer_by_first_name(): void
    {
        $user = User::factory()->unverified()->create(['name' => 'Bisi Adeleye']);

        $mail = (new VerifyEmail)->toMail($user);
        $html = (string) $mail->render();

        $this->assertSame('Hello Bisi,', $mail->greeting);
        $this->assertStringContainsString('Hello Bisi,', $html);
        $this->assertStringContainsString('Verify Email Address', $html);
        $this->assertStringNotContainsString('Hello!', $html);
    }

    public function test_password_reset_email_greets_the_customer_by_first_name(): void
    {
        $user = User::factory()->create(['name' => 'Bisi Adeleye']);

        $mail = (new ResetPassword('token-123'))->toMail($user);

        $this->assertSame('Hello Bisi,', $mail->greeting);
        $this->assertStringContainsString('token-123', (string) $mail->render());
    }
}
