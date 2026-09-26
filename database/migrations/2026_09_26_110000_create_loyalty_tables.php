<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loyalty_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            // earn | redeem | reversal | restore | adjust | expire
            $table->string('type');
            // Signed: positive adds points, negative removes them.
            $table->integer('points');
            // For point-adding rows only: how many of these points are still unspent.
            $table->unsignedInteger('remaining')->default(0);
            $table->timestamp('expires_at')->nullable();
            $table->string('note')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'type']);
            $table->index(['order_id', 'type']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedInteger('loyalty_points_redeemed')->default(0);
            $table->decimal('loyalty_discount', 10, 2)->default(0);
            // null = points not awarded yet, 0+ = already processed.
            $table->unsignedInteger('loyalty_points_earned')->nullable();
        });

        Schema::table('store_settings', function (Blueprint $table) {
            $table->boolean('loyalty_enabled')->default(true);
            $table->decimal('loyalty_points_per_dollar', 6, 2)->default(1);
            $table->decimal('loyalty_point_value', 6, 4)->default(0.02);
            $table->unsignedInteger('loyalty_min_redeem')->default(100);
            $table->unsignedSmallInteger('loyalty_max_percent')->default(50);
            $table->unsignedSmallInteger('loyalty_expiry_months')->nullable()->default(12);
        });
    }

    public function down(): void
    {
        Schema::table('store_settings', function (Blueprint $table) {
            $table->dropColumn([
                'loyalty_enabled', 'loyalty_points_per_dollar', 'loyalty_point_value',
                'loyalty_min_redeem', 'loyalty_max_percent', 'loyalty_expiry_months',
            ]);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['loyalty_points_redeemed', 'loyalty_discount', 'loyalty_points_earned']);
        });

        Schema::dropIfExists('loyalty_transactions');
    }
};
