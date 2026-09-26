<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class FriendlyClientErrorTest extends TestCase
{
    use RefreshDatabase;

    public function test_wrong_method_on_an_inertia_request_becomes_a_friendly_toast(): void
    {
        $this->from('/menu')
            ->withHeaders(['X-Inertia' => 'true'])
            ->post('/verify-email')
            ->assertRedirect('/menu')
            ->assertSessionHas('error', 'That action is not available right now. Please try again.');
    }

    public function test_a_missing_page_on_an_inertia_request_becomes_a_friendly_toast(): void
    {
        $this->from('/menu')
            ->withHeaders(['X-Inertia' => 'true'])
            ->get('/definitely-not-a-page')
            ->assertRedirect('/menu')
            ->assertSessionHas('error');
    }

    public function test_plain_requests_still_get_normal_error_responses(): void
    {
        $this->get('/definitely-not-a-page')->assertNotFound();
    }

    public function test_an_unverified_customer_can_resend_the_verification_email(): void
    {
        Notification::fake();
        $user = User::factory()->unverified()->create();

        $this->actingAs($user)
            ->post('/email/verification-notification')
            ->assertSessionHas('status', 'verification-link-sent');

        Notification::assertSentTo($user, VerifyEmail::class);
    }
}
