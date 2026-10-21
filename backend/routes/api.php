<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ViajauController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', [ViajauController::class, 'health']);
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::post('/profile/photo', [AuthController::class, 'updateProfile']);
    Route::put('/auth/change-password', [AuthController::class, 'changePassword'])
        ->middleware('throttle:5,1');
    Route::post('/auth/email/verification-notification', [AuthController::class, 'resendVerification'])
        ->middleware('throttle:6,1');
    Route::get('/students/{id}', [ViajauController::class, 'showStudent']);
    Route::put('/students/{id}/profile', [ViajauController::class, 'updateProfile']);

    Route::middleware('verified')->group(function () {
        Route::get('/trips', [ViajauController::class, 'listTrips']);
        Route::post('/trips', [ViajauController::class, 'createTrip']);
        Route::get('/trips/mine', [ViajauController::class, 'myTrips']);
        Route::post('/trips/{trip}/requests', [ViajauController::class, 'createTripRequest']);
        Route::patch('/trips/{trip}', [ViajauController::class, 'cancelTrip']);
        Route::post('/trips/{trip}/location', [ViajauController::class, 'shareTripLocation'])
            ->middleware('throttle:30,1');
        Route::delete('/trips/{trip}/location', [ViajauController::class, 'stopSharingTripLocation']);
        Route::get('/trips/{trip}/safety', [ViajauController::class, 'tripSafetyStatus']);
        Route::post('/trips/{trip}/check-ins', [ViajauController::class, 'createTripCheckIn'])
            ->middleware('throttle:10,1');
        Route::patch('/trip-requests/{tripRequest}', [ViajauController::class, 'updateTripRequest']);
        Route::get('/matches', [ViajauController::class, 'listMatches']);
        Route::post('/alerts', [ViajauController::class, 'createAlert'])->middleware('throttle:3,1');
    });

    Route::middleware(['verified', 'role:admin,university'])->get('/dashboard', [ViajauController::class, 'dashboard']);
    Route::middleware(['verified', 'role:security,admin'])->group(function () {
        Route::get('/security/alerts', [ViajauController::class, 'securityAlerts']);
        Route::patch('/security/alerts/{alert}/resolve', [ViajauController::class, 'resolveSafetyAlert']);
    });
});
