<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Email verification is now required for customer accounts. Admins already
     * run the store, so do not lock them out of anything.
     */
    public function up(): void
    {
        DB::table('users')
            ->where('role', 'admin')
            ->whereNull('email_verified_at')
            ->update(['email_verified_at' => now()]);
    }

    public function down(): void
    {
        // Nothing to undo.
    }
};
