<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AbandonedCart extends Model
{
    protected $fillable = ['email', 'name', 'user_id', 'items', 'token', 'last_activity_at', 'reminder_sent_at'];

    protected function casts(): array
    {
        return [
            'items' => 'array',
            'last_activity_at' => 'datetime',
            'reminder_sent_at' => 'datetime',
        ];
    }
}
