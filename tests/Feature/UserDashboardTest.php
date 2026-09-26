<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserDashboardTest extends TestCase
{
    use RefreshDatabase;

    private function order(User $user, int $n = 1): void
    {
        for ($i = 0; $i < $n; $i++) {
            Order::query()->create([
                'user_id' => $user->id, 'customer_name' => 'A', 'customer_email' => 'a@b.co',
                'subtotal' => 10, 'tax' => 1, 'delivery_fee' => 0, 'total' => 11,
                'collection_method' => 'pickup', 'status' => 'pending', 'payment_status' => 'unpaid',
            ]);
        }
    }

    private function booking(User $user, int $n = 1): void
    {
        for ($i = 0; $i < $n; $i++) {
            Booking::query()->create([
                'user_id' => $user->id, 'customer_name' => 'A', 'customer_email' => 'a@b.co',
                'booking_type' => 'dine_in', 'date' => now()->addDay(), 'time' => '6:00 PM', 'guests' => 2,
            ]);
        }
    }

    public function test_dashboard_shows_only_ten_records_but_the_full_totals()
    {
        $user = User::factory()->create();
        $this->order($user, 12);
        $this->booking($user, 11);

        $this->actingAs($user)->get('/dashboard')->assertInertia(fn ($page) => $page
            ->has('orders', 10)->has('bookings', 10)
            ->where('orderCount', 12)->where('bookingCount', 11));
    }

    public function test_orders_page_is_paginated_and_only_shows_own_records()
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $this->order($user, 16);
        $this->order($other, 3);

        $this->actingAs($user)->get('/dashboard/orders')->assertInertia(fn ($page) => $page
            ->component('public/dashboard/Orders')->has('orders.data', 15)->where('orders.total', 16));
    }

    public function test_bookings_page_only_shows_own_records()
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $this->booking($user, 2);
        $this->booking($other, 4);

        $this->actingAs($user)->get('/dashboard/bookings')->assertInertia(fn ($page) => $page
            ->component('public/dashboard/Bookings')->has('bookings.data', 2));
    }

    public function test_guests_are_sent_to_login()
    {
        $this->get('/dashboard/orders')->assertRedirect('/login');
        $this->get('/dashboard/bookings')->assertRedirect('/login');
    }
}
