<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BlogFormTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => UserRole::Admin]);
    }

    private function payload(array $overrides = []): array
    {
        return [
            'title' => 'A Taste of Windsor',
            'content' => '<p>Great food story.</p>',
            'published_at' => now()->format('Y-m-d\TH:i'),
            ...$overrides,
        ];
    }

    public function test_creating_a_post_without_a_featured_image_fails_validation()
    {
        $response = $this->actingAs($this->admin())->post('/admin/blogs', $this->payload());

        $response->assertSessionHasErrors('image');
        $this->assertDatabaseCount('blog_posts', 0);
    }

    public function test_creating_a_post_without_a_published_at_fails_validation()
    {
        Storage::fake('public');

        $payload = $this->payload(['image' => UploadedFile::fake()->image('cover.jpg')]);
        unset($payload['published_at']);

        $response = $this->actingAs($this->admin())->post('/admin/blogs', $payload);

        $response->assertSessionHasErrors('published_at');
        $this->assertDatabaseCount('blog_posts', 0);
    }

    public function test_creating_a_post_with_image_and_published_at_succeeds()
    {
        Storage::fake('public');

        $response = $this->actingAs($this->admin())->post('/admin/blogs', $this->payload([
            'image' => UploadedFile::fake()->image('cover.jpg'),
        ]));

        $response->assertRedirect(route('admin.blogs.index'));
        $this->assertDatabaseCount('blog_posts', 1);
    }

    public function test_updating_a_post_that_already_has_an_image_does_not_require_a_new_one()
    {
        $post = BlogPost::query()->forceCreate([
            'title' => 'Existing Post',
            'slug' => 'existing-post',
            'content' => '<p>Old content.</p>',
            'image_url' => 'blog/existing.jpg',
            'published_at' => now(),
        ]);

        $response = $this->actingAs($this->admin())
            ->put("/admin/blogs/{$post->id}", $this->payload(['title' => 'Updated Post']));

        $response->assertRedirect(route('admin.blogs.index'));
        $this->assertSame('Updated Post', $post->fresh()->title);
    }
}
