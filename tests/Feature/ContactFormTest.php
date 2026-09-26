<?php

namespace Tests\Feature;

use App\Mail\ContactMessageReceived;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ContactFormTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['mail.order_notifications' => ['info@ratalfoods.ca']]);
    }

    private function payload(array $overrides = []): array
    {
        return [
            'name' => 'Ada Lovelace',
            'email' => 'ada@example.com',
            'phone' => '555-0100',
            'message' => 'Do you cater private events?',
            ...$overrides,
        ];
    }

    public function test_name_email_and_message_are_required()
    {
        Mail::fake();

        $response = $this->post('/contact', []);

        $response->assertSessionHasErrors(['name', 'email', 'message']);
    }

    public function test_phone_is_optional()
    {
        Mail::fake();

        $payload = $this->payload();
        unset($payload['phone']);

        $response = $this->post('/contact', $payload);

        $response->assertSessionDoesntHaveErrors('phone');
        $response->assertRedirect();
    }

    public function test_a_complete_submission_succeeds()
    {
        Mail::fake();

        $response = $this->post('/contact', $this->payload());

        $response->assertSessionDoesntHaveErrors();
        $response->assertRedirect();
    }

    public function test_the_store_receives_the_message_by_email()
    {
        Mail::fake();

        $this->post('/contact', $this->payload());

        Mail::assertSent(ContactMessageReceived::class, fn ($mail) => $mail->hasTo('info@ratalfoods.ca')
            && $mail->hasReplyTo('ada@example.com'));
    }

    public function test_a_delivery_request_is_labelled_as_such()
    {
        Mail::fake();

        $this->post('/contact', $this->payload([
            'type' => 'delivery',
            'address' => '123 Main St',
            'preferred_time' => 'Tomorrow evening',
        ]));

        Mail::assertSent(ContactMessageReceived::class, function ($mail) {
            $rendered = $mail->render();

            return str_contains($rendered, 'New delivery request')
                && str_contains($rendered, '123 Main St');
        });
    }
}
