<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class GalleryFormTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => UserRole::Admin]);
    }

    public function test_adding_gallery_media_without_a_title_fails_validation()
    {
        Storage::fake('public');

        $response = $this->actingAs($this->admin())->post('/admin/gallery', [
            'media_file' => UploadedFile::fake()->image('shot.jpg'),
        ]);

        $response->assertSessionHasErrors('title');
        $this->assertDatabaseCount('gallery_items', 0);
    }

    public function test_adding_gallery_media_with_a_title_succeeds()
    {
        Storage::fake('public');

        $response = $this->actingAs($this->admin())->post('/admin/gallery', [
            'title' => 'Signature dish',
            'media_file' => UploadedFile::fake()->image('shot.jpg'),
        ]);

        $response->assertRedirect(route('admin.gallery.index'));
        $this->assertDatabaseCount('gallery_items', 1);
    }
}
