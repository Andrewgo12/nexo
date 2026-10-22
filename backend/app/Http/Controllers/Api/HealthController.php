<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use PDOException;

class HealthController extends Controller
{
    public function live(): JsonResponse
    {
        return response()->json([
            'status' => 'alive',
            'app' => 'ViajaU',
            'timestamp' => now()->toISOString(),
        ]);
    }

    public function ready(): JsonResponse
    {
        try {
            DB::select('SELECT 1');
        } catch (PDOException $exception) {
            Log::warning('Application readiness check failed.', [
                'dependency' => 'database',
                'exception' => $exception::class,
            ]);

            return response()->json([
                'status' => 'not_ready',
                'checks' => ['database' => 'unavailable'],
            ], 503);
        }

        return response()->json([
            'status' => 'ready',
            'checks' => ['database' => 'ok'],
            'timestamp' => now()->toISOString(),
        ]);
    }
}
