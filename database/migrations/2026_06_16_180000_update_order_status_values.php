<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $map = [
            'confirmed' => 'processing',
            'preparing' => 'processing',
            'ready' => 'completed',
            'pending' => 'pending',
            'completed' => 'completed',
            'cancelled' => 'cancelled',
        ];

        foreach ($map as $from => $to) {
            DB::table('orders')->where('status', $from)->update(['status' => $to]);
        }
    }

    public function down(): void
    {
        $map = [
            'processing' => 'confirmed',
            'payment_confirmed' => 'confirmed',
            'delivered' => 'completed',
            'refunded' => 'cancelled',
        ];

        foreach ($map as $from => $to) {
            DB::table('orders')->where('status', $from)->update(['status' => $to]);
        }
    }
};
