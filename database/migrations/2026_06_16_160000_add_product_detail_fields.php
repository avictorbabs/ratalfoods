<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('in_stock')->default(true)->after('is_active');
            $table->json('variations')->nullable()->after('in_stock');
            $table->json('tags')->nullable()->after('variations');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['in_stock', 'variations', 'tags']);
        });
    }
};
