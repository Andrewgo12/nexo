<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireHttpsInProduction
{
    public function handle(Request $request, Closure $next): Response
    {
        if (app()->environment('production') && ! $request->isSecure()) {
            return response()->json([
                'message' => 'Esta aplicación requiere una conexión HTTPS segura.',
            ], 400);
        }

        return $next($request);
    }
}
