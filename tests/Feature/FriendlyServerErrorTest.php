<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use RuntimeException;
use Tests\TestCase;

class FriendlyServerErrorTest extends TestCase
{
    public function test_a_server_error_on_an_inertia_request_redirects_back_with_a_flash_message()
    {
        Route::post('/__test/boom', function (): never {
            throw new RuntimeException('Something exploded.');
        })->middleware('web');

        $response = $this->withHeaders(['X-Inertia' => 'true', 'Referer' => '/somewhere'])
            ->post('/__test/boom');

        $response->assertRedirect('/somewhere');
        $response->assertSessionHas('error');
    }

    public function test_validation_exceptions_are_left_to_the_normal_inertia_flow()
    {
        Route::post('/__test/validate', function (): void {
            request()->validate(['name' => 'required']);
        })->middleware('web');

        $response = $this->withHeaders(['X-Inertia' => 'true', 'Referer' => '/somewhere'])
            ->post('/__test/validate');

        $response->assertSessionHasErrors('name');
        $response->assertSessionMissing('error');
    }

    public function test_non_inertia_requests_are_not_touched_by_the_friendly_handler()
    {
        Route::post('/__test/boom-plain', function (): never {
            throw new RuntimeException('Something exploded.');
        });

        $response = $this->post('/__test/boom-plain');

        $response->assertStatus(500);
    }
}
