<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recurring_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('active'); // active | paused | cancelled | ended
            $table->string('frequency'); // weekly | biweekly
            $table->string('collection_method');
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone');
            $table->string('pickup_slot')->nullable(); // e.g. "4:00 PM"
            $table->string('delivery_slot')->nullable(); // e.g. "16:00"
            $table->text('delivery_address')->nullable();
            $table->text('notes')->nullable();
            $table->json('items');
            // The next service date that has not been turned into an order yet.
            $table->date('next_service_date');
            $table->date('ends_on')->nullable();
            $table->json('skipped_dates')->nullable();
            $table->timestamps();

            $table->index(['status', 'next_service_date']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('recurring_order_id')->nullable()->constrained()->nullOnDelete();
            $table->date('recurring_for')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('recurring_order_id');
            $table->dropColumn('recurring_for');
        });

        Schema::dropIfExists('recurring_orders');
    }
};
