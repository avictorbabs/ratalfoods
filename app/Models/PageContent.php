<?php

namespace App\Models;

use App\Support\PageContentDefaults;
use App\Support\PublicMediaUrl;
use Illuminate\Database\Eloquent\Model;

class PageContent extends Model
{
    protected $fillable = [
        'slug',
        'content',
    ];

    protected function casts(): array
    {
        return [
            'content' => 'array',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function resolved(string $slug): array
    {
        $defaults = PageContentDefaults::for($slug);
        $record = static::query()->firstOrCreate(
            ['slug' => $slug],
            ['content' => $defaults],
        );

        $merged = PageContentDefaults::merge($defaults, is_array($record->content) ? $record->content : []);

        return PublicMediaUrl::resolveTree($merged);
    }
}
