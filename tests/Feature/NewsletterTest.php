<?php

namespace Tests\Feature;

use App\Mail\NewsletterSignupReceived;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class NewsletterTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['mail.order_notifications' => ['info@ratalfoods.ca']]);
    }

    public function test_a_signup_emails_the_store()
    {
        Mail::fake();

        $response = $this->post('/newsletter', [
            'name' => 'Ada Lovelace',
            'email' => 'ada@example.com',
        ]);

        $response->assertSessionDoesntHaveErrors();
        Mail::assertSent(NewsletterSignupReceived::class, fn ($mail) => $mail->hasTo('info@ratalfoods.ca')
            && $mail->hasReplyTo('ada@example.com'));
    }

    public function test_name_and_email_are_required()
    {
        Mail::fake();

        $response = $this->post('/newsletter', []);

        $response->assertSessionHasErrors(['name', 'email']);
    }
}
