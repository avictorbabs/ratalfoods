<?php

use App\Models\PageContent;
use App\Support\PageContentDefaults;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('page_contents', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->json('content');
            $table->timestamps();
        });

        foreach (PageContentDefaults::slugs() as $slug) {
            PageContent::query()->firstOrCreate(
                ['slug' => $slug],
                ['content' => PageContentDefaults::for($slug)],
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('page_contents');
    }
};
