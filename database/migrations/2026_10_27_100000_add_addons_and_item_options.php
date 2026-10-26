<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->json('addons')->nullable();
        });

        Schema::table('order_items', function (Blueprint $table) {
            // What the customer chose (variations and add-ons), kept as charged.
            $table->json('options')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn('options');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('addons');
        });
    }
};
