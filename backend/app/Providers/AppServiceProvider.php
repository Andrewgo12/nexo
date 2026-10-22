<?php

namespace App\Providers;

use Illuminate\Console\Events\ScheduledTaskFailed;
use Illuminate\Queue\Events\QueueBusy;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Event::listen(QueueBusy::class, static function (QueueBusy $event): void {
            Log::critical('Queue backlog exceeds the configured threshold.', [
                'connection' => $event->connectionName,
                'queue' => $event->queue,
                'size' => $event->size,
            ]);
        });

        Event::listen(ScheduledTaskFailed::class, static function (ScheduledTaskFailed $event): void {
            Log::critical('Scheduled task failed.', [
                'command' => $event->task->command,
                'exception' => $event->exception->getMessage(),
            ]);
        });
    }
}
