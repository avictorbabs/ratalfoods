<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('user')->after('password');
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->string('category');
            $table->string('image_url')->nullable();
            $table->boolean('available_for_pickup')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->string('preparation_time')->default('Ready in 2 Hours');
            $table->string('serves')->nullable();
            $table->text('ingredients')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'is_featured']);
            $table->index('category');
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone')->nullable();
            $table->decimal('subtotal', 10, 2);
            $table->decimal('tax', 10, 2)->default(0);
            $table->decimal('total', 10, 2);
            $table->string('collection_method')->default('pickup');
            $table->string('status')->default('pending');
            $table->string('payment_status')->default('unpaid');
            $table->string('pickup_time')->nullable();
            $table->text('delivery_address')->nullable();
            $table->string('delivery_time_preference')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('customer_email');
            $table->index('status');
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('product_name');
            $table->unsignedInteger('quantity');
            $table->decimal('price', 10, 2);
            $table->timestamps();
        });

        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_number')->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone')->nullable();
            $table->string('booking_type')->default('dine_in');
            $table->date('date');
            $table->string('time');
            $table->unsignedInteger('guests')->default(2);
            $table->string('occasion')->nullable();
            $table->text('notes')->nullable();
            $table->string('status')->default('pending');
            $table->timestamps();

            $table->index('customer_email');
            $table->index('status');
        });

        Schema::create('store_settings', function (Blueprint $table) {
            $table->id();
            $table->string('store_name')->default('Ratal Foods');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->boolean('is_open')->default(true);
            $table->text('opening_hours')->nullable();
            $table->decimal('tax_rate', 5, 2)->default(13);
            $table->string('pickup_message')->default('Ready in 2 Hours');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_settings');
        Schema::dropIfExists('bookings');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('products');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};
