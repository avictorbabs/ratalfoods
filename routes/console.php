<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('carts:send-reminders')->everyFifteenMinutes()->withoutOverlapping();
Schedule::command('orders:send-review-requests')->hourly()->withoutOverlapping();
Schedule::command('loyalty:expire')->dailyAt('03:00')->withoutOverlapping();
Schedule::command('customers:send-winback')->dailyAt('10:00')->withoutOverlapping();
Schedule::command('recurring:generate')->hourly()->withoutOverlapping();
