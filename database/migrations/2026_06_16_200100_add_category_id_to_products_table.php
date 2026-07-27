<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('category_id')
                ->nullable()
                ->after('category')
                ->constrained()
                ->nullOnDelete();
        });

        $categories = DB::table('categories')->pluck('id', 'name');

        DB::table('products')
            ->orderBy('id')
            ->lazyById()
            ->each(function (object $product) use ($categories): void {
                $categoryName = $product->category;

                if (! is_string($categoryName) || ! isset($categories[$categoryName])) {
                    return;
                }

                DB::table('products')
                    ->where('id', $product->id)
                    ->update(['category_id' => $categories[$categoryName]]);
            });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropConstrainedForeignId('category_id');
        });
    }
};
