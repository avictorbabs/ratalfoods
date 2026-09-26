<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Unguessable token so guests can follow an order without an account.
            $table->string('tracking_token', 40)->nullable()->unique();
        });

        Schema::create('order_status_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('status');
            $table->timestamp('created_at')->useCurrent();
        });

        DB::table('orders')->whereNull('tracking_token')->orderBy('id')->each(function ($order): void {
            DB::table('orders')->where('id', $order->id)->update(['tracking_token' => Str::random(32)]);
            DB::table('order_status_events')->insert([
                'order_id' => $order->id,
                'status' => $order->status,
                'created_at' => $order->updated_at ?? $order->created_at ?? now(),
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_status_events');

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('tracking_token');
        });
    }
};
