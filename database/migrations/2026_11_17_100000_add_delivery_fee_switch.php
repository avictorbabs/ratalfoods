<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('store_settings', function (Blueprint $table) {
            $table->boolean('delivery_fee_enabled')->default(true);
        });

        Schema::table('orders', function (Blueprint $table) {
            // True when a delivery order was placed while delivery fees were switched off:
            // the store agrees the fee with the customer afterwards.
            $table->boolean('delivery_fee_pending')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('delivery_fee_pending');
        });

        Schema::table('store_settings', function (Blueprint $table) {
            $table->dropColumn('delivery_fee_enabled');
        });
    }
};
