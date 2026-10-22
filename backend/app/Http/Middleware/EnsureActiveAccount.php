<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveAccount
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user()?->fresh();

        abort_unless($user instanceof User && $user->status === User::STATUS_ACTIVE, 403, 'La cuenta no está activa.');

        if (Auth::guard('web')->check()) {
            abort_unless(
                (int) $request->session()->get('auth_version', -1) === (int) $user->auth_version,
                401,
                'La sesión ya no es válida. Inicia sesión de nuevo.',
            );
        }

        return $next($request);
    }
}
