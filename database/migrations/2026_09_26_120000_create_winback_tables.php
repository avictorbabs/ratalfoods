<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_opt_outs', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('winback_emails', function (Blueprint $table) {
            $table->id();
            $table->string('email')->index();
            $table->foreignId('coupon_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('sent_at')->useCurrent();
        });

        Schema::table('coupons', function (Blueprint $table) {
            // welcome | winback | null (a normal shared promo code)
            $table->string('campaign')->nullable()->index();
        });

        DB::table('coupons')->where('is_welcome', true)->update(['campaign' => 'welcome']);

        Schema::table('store_settings', function (Blueprint $table) {
            $table->boolean('winback_enabled')->default(true);
            $table->unsignedSmallInteger('winback_days_inactive')->default(30);
            $table->decimal('winback_discount_percent', 5, 2)->default(10);
            $table->unsignedSmallInteger('winback_valid_days')->default(14);
        });
    }

    public function down(): void
    {
        Schema::table('store_settings', function (Blueprint $table) {
            $table->dropColumn(['winback_enabled', 'winback_days_inactive', 'winback_discount_percent', 'winback_valid_days']);
        });

        Schema::table('coupons', function (Blueprint $table) {
            $table->dropColumn('campaign');
        });

        Schema::dropIfExists('winback_emails');
        Schema::dropIfExists('email_opt_outs');
    }
};
