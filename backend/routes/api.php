<?php

use App\Http\Controllers\Api\ViajauController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', [ViajauController::class, 'health']);
Route::post('/students/register', [ViajauController::class, 'registerStudent']);
Route::get('/students/{id}', [ViajauController::class, 'showStudent']);
Route::put('/students/{id}/profile', [ViajauController::class, 'updateProfile']);
Route::get('/trips', [ViajauController::class, 'listTrips']);
Route::post('/trips', [ViajauController::class, 'createTrip']);
Route::get('/matches', [ViajauController::class, 'listMatches']);
Route::post('/matches', [ViajauController::class, 'createMatch']);
Route::post('/alerts', [ViajauController::class, 'createAlert']);
Route::get('/dashboard', [ViajauController::class, 'dashboard']);

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
