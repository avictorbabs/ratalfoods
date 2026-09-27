<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\PageContent;
use App\Models\StoreSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LegalPagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_each_legal_page_is_public_and_has_real_content(): void
    {
        $this->get('/faq')->assertOk()->assertInertia(fn ($page) => $page
            ->component('public/Faq')
            ->where('pageContent.title', 'Frequently Asked Questions')
            ->has('pageContent.items', 16));

        foreach (['/privacy-policy' => 'Privacy Policy', '/terms-and-conditions' => 'Terms & Conditions', '/refund-policy' => 'Refund Policy'] as $url => $title) {
            $this->get($url)->assertOk()->assertInertia(fn ($page) => $page
                ->component('public/LegalPage')
                ->where('pageContent.title', $title)
                ->where('pageContent.updated_on', 'September 26, 2026'));
        }
    }

    public function test_store_details_are_filled_in_and_no_placeholder_is_left_showing(): void
    {
        StoreSetting::current()->update(['email' => 'hello@ratalfoods.example', 'phone' => '555-111-2222', 'address' => '1 Test Street, Windsor']);

        foreach (['/privacy-policy', '/terms-and-conditions', '/refund-policy', '/faq'] as $url) {
            $html = json_encode($this->get($url)->viewData('page')['props']['pageContent']);

            $this->assertStringNotContainsString('{store_', $html, "{$url} still shows a placeholder");
        }

        $this->get('/privacy-policy')->assertInertia(fn ($page) => $page->where('pageContent.body', fn ($body) => str_contains($body, 'hello@ratalfoods.example')));
        $this->get('/faq')->assertInertia(fn ($page) => $page->where('pageContent.items', fn ($items) => str_contains(json_encode($items), '555-111-2222')));
    }

    public function test_the_footer_gets_a_legal_pages_column(): void
    {
        $this->get('/')->assertInertia(fn ($page) => $page
            ->where('footerContent.legal_heading', 'Legal Pages')
            ->where('footerContent.legal.0.href', '/faq')
            ->where('footerContent.legal.1.href', '/privacy-policy')
            ->where('footerContent.legal.2.href', '/terms-and-conditions')
            ->where('footerContent.legal.3.href', '/refund-policy'));
    }

    public function test_a_footer_saved_before_this_feature_still_shows_the_legal_links(): void
    {
        PageContent::query()->updateOrCreate(['slug' => 'footer'], ['content' => ['brand_name' => 'Ratal Foods', 'phone' => '555']]);

        $this->get('/')->assertInertia(fn ($page) => $page->where('footerContent.legal_heading', 'Legal Pages')->has('footerContent.legal', 4));
    }

    public function test_admin_can_edit_each_page_and_the_change_shows_publicly(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);

        foreach (['faq', 'privacy', 'terms', 'refund'] as $slug) {
            $this->actingAs($admin)->get("/admin/pages/{$slug}")->assertOk()->assertInertia(fn ($page) => $page->component('admin/Pages/Edit')->where('slug', $slug));
        }

        $this->actingAs($admin)->put('/admin/pages/privacy', ['content' => [
            'title' => 'Privacy Policy', 'updated_on' => 'October 1, 2026', 'body' => '<h2>New section</h2><p>Hello {store_name}</p>',
        ]])->assertSessionHasNoErrors();

        $this->get('/privacy-policy')->assertInertia(fn ($page) => $page
            ->where('pageContent.updated_on', 'October 1, 2026')
            ->where('pageContent.body', '<h2>New section</h2><p>Hello Ratal Foods</p>'));

        $this->put('/admin/pages/faq', ['content' => [
            'title' => 'FAQ', 'intro' => 'Hi', 'items' => [['question' => 'Open Sundays?', 'answer' => 'No.']],
        ]])->assertSessionHasNoErrors();

        $this->get('/faq')->assertInertia(fn ($page) => $page->has('pageContent.items', 1)->where('pageContent.items.0.question', 'Open Sundays?'));
    }

    public function test_customers_cannot_edit_the_legal_pages(): void
    {
        $this->actingAs(User::factory()->create())->put('/admin/pages/terms', ['content' => ['title' => 'x']])->assertForbidden();
    }
}
