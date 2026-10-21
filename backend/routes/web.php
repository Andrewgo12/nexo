<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/auth/verify-email/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->middleware('signed')
    ->name('verification.verify');

Route::get('/reset-password/{token}', function (string $token) {
    $query = http_build_query([
        'reset_token' => $token,
        'email' => request()->query('email'),
    ]);

    return redirect()->away(rtrim(config('viajau.frontend_url'), '/').'?'.$query);
})->name('password.reset');
