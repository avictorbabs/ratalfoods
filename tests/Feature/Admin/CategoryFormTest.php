<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CategoryFormTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => UserRole::Admin]);
    }

    public function test_creating_a_category_without_a_thumbnail_fails_validation()
    {
        $this->assertDatabaseMissing('categories', ['slug' => 'sides']);

        $response = $this->actingAs($this->admin())->post('/admin/categories', [
            'name' => 'Sides',
            'slug' => 'sides',
        ]);

        $response->assertSessionHasErrors('category_image');
        $this->assertDatabaseMissing('categories', ['slug' => 'sides']);
    }

    public function test_creating_a_category_with_a_thumbnail_succeeds()
    {
        Storage::fake('public');

        $response = $this->actingAs($this->admin())->post('/admin/categories', [
            'name' => 'Sides',
            'slug' => 'sides',
            'category_image' => UploadedFile::fake()->image('sides.jpg'),
        ]);

        $response->assertRedirect(route('admin.categories.index'));
        $this->assertDatabaseHas('categories', ['slug' => 'sides']);
    }

    public function test_updating_a_category_that_already_has_a_thumbnail_does_not_require_a_new_one()
    {
        $category = Category::query()->forceCreate([
            'name' => 'Mains',
            'slug' => 'mains',
            'image_url' => 'categories/existing.jpg',
        ]);

        $response = $this->actingAs($this->admin())->put("/admin/categories/{$category->id}", [
            'name' => 'Mains Updated',
            'slug' => 'mains',
        ]);

        $response->assertRedirect(route('admin.categories.index'));
        $this->assertSame('Mains Updated', $category->fresh()->name);
    }
}
