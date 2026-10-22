<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use PDOException;
use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    use RefreshDatabase;

    public function test_liveness_check_does_not_require_database_availability(): void
    {
        DB::shouldReceive('select')->never();

        $this->getJson('/api/health')->assertOk()
            ->assertJsonPath('status', 'alive')
            ->assertJsonPath('app', 'ViajaU')
            ->assertJsonMissingPath('checks.database');
    }

    public function test_readiness_check_reports_database_availability(): void
    {
        $this->getJson('/api/ready')->assertOk()
            ->assertJsonPath('status', 'ready')
            ->assertJsonPath('checks.database', 'ok');
    }

    public function test_readiness_check_returns_service_unavailable_if_database_is_down(): void
    {
        DB::shouldReceive('select')->once()->with('SELECT 1')
            ->andThrow(new PDOException('database is unavailable'));
        Log::shouldReceive('warning')->once()->with(
            'Application readiness check failed.',
            ['dependency' => 'database', 'exception' => PDOException::class],
        );

        $this->getJson('/api/ready')->assertServiceUnavailable()
            ->assertJsonPath('status', 'not_ready')
            ->assertJsonPath('checks.database', 'unavailable');
    }
}
