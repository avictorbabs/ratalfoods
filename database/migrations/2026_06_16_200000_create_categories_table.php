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
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('image_url')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        $defaults = [
            ['name' => 'Nigerian Classics', 'sort_order' => 1],
            ['name' => 'All-Time Favourites', 'sort_order' => 2],
            ['name' => 'Grilled & Spicy', 'sort_order' => 3],
            ['name' => 'Seasonal Specials', 'sort_order' => 4],
            ['name' => 'Sides & Extras', 'sort_order' => 5],
        ];

        $now = now();

        foreach ($defaults as $row) {
            DB::table('categories')->insert([
                'name' => $row['name'],
                'slug' => Str::slug($row['name']),
                'description' => null,
                'image_url' => null,
                'sort_order' => $row['sort_order'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
