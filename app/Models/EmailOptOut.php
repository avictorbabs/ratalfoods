<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailOptOut extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['email'];

    public static function normalize(string $email): string
    {
        return strtolower(trim($email));
    }

    public static function contains(string $email): bool
    {
        return static::query()->where('email', static::normalize($email))->exists();
    }
}
