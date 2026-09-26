<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('type')->default('percent'); // percent | fixed
            $table->decimal('value', 8, 2);
            $table->decimal('min_order', 8, 2)->nullable();
            $table->decimal('max_discount', 8, 2)->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->unsignedInteger('usage_limit')->nullable();
            $table->boolean('first_order_only')->default(false);
            $table->string('email')->nullable()->index();
            $table->boolean('is_welcome')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('newsletter_subscribers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('subscribed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('abandoned_carts', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('name')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->json('items');
            $table->string('token', 64)->unique();
            $table->timestamp('last_activity_at');
            $table->timestamp('reminder_sent_at')->nullable();
            $table->timestamps();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('coupon_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
            $table->string('coupon_code')->nullable()->after('coupon_id');
            $table->decimal('discount', 10, 2)->default(0)->after('subtotal');
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('review_requested_at')->nullable();
        });

        Schema::table('store_settings', function (Blueprint $table) {
            $table->boolean('welcome_offer_enabled')->default(true);
            $table->decimal('welcome_discount_percent', 5, 2)->default(5);
            $table->decimal('welcome_max_discount', 8, 2)->nullable();
            $table->decimal('welcome_min_order', 8, 2)->nullable();
            $table->unsignedSmallInteger('welcome_valid_days')->default(14);
            $table->unsignedSmallInteger('welcome_delay_seconds')->default(8);
            $table->string('welcome_headline')->default('Get 5% off your first order');
            $table->text('welcome_body')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('store_settings', function (Blueprint $table) {
            $table->dropColumn([
                'welcome_offer_enabled', 'welcome_discount_percent', 'welcome_max_discount', 'welcome_min_order',
                'welcome_valid_days', 'welcome_delay_seconds', 'welcome_headline', 'welcome_body',
            ]);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('coupon_id');
            $table->dropColumn(['coupon_code', 'discount', 'completed_at', 'review_requested_at']);
        });

        Schema::dropIfExists('abandoned_carts');
        Schema::dropIfExists('newsletter_subscribers');
        Schema::dropIfExists('coupons');
    }
};
