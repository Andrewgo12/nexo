<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

$arrivalCheckIns = Schedule::command('viajau:alert-overdue-arrivals')
    ->everyMinute()
    ->withoutOverlapping();
$arrivalCheckIns->onSuccess(static fn () => Log::info('Safety arrival-check-in scheduler completed.', [
    'completed_at' => now()->toISOString(),
]));

$queueConnection = config('queue.default');
Schedule::command("queue:monitor {$queueConnection}:safety,{$queueConnection}:default --max=100")
    ->everyMinute()
    ->withoutOverlapping();
