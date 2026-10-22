<?php

namespace Tests\Feature;

use Illuminate\Console\Events\ScheduledTaskFailed;
use Illuminate\Console\Scheduling\Event as ScheduledEvent;
use Illuminate\Console\Scheduling\EventMutex;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Queue\Events\QueueBusy;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Tests\TestCase;

class QueueMonitoringTest extends TestCase
{
    use RefreshDatabase;

    public function test_queue_backlog_emits_a_critical_log_with_queue_dimensions(): void
    {
        Log::shouldReceive('critical')
            ->once()
            ->with('Queue backlog exceeds the configured threshold.', [
                'connection' => 'database',
                'queue' => 'safety',
                'size' => 101,
            ]);

        Event::dispatch(new QueueBusy('database', 'safety', 101));
    }

    public function test_failed_scheduled_task_emits_a_critical_log(): void
    {
        Log::shouldReceive('critical')
            ->once()
            ->with('Scheduled task failed.', [
                'command' => 'php artisan viajau:alert-overdue-arrivals',
                'exception' => 'Scheduler unavailable',
            ]);

        Event::dispatch(new ScheduledTaskFailed(
            new ScheduledEvent(
                \Mockery::mock(EventMutex::class),
                'php artisan viajau:alert-overdue-arrivals',
            ),
            new RuntimeException('Scheduler unavailable'),
        ));
    }

    public function test_safety_arrival_and_queue_monitoring_are_scheduled_every_minute(): void
    {
        $this->artisan('schedule:list')
            ->expectsOutputToContain('viajau:alert-overdue-arrivals')
            ->expectsOutputToContain('queue:monitor')
            ->assertExitCode(0);
    }
}
