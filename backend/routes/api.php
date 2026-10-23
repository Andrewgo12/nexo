<?php

use App\Http\Controllers\Api\AdminManagementController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\InsuranceController;
use App\Http\Controllers\Api\MembershipController;
use App\Http\Controllers\Api\ReputationController;
use App\Http\Controllers\Api\SafetyAlertController;
use App\Http\Controllers\Api\TravelMatchController;
use App\Http\Controllers\Api\TripCommunicationController;
use App\Http\Controllers\Api\TripSafetyController;
use App\Http\Controllers\Api\ViajauController;
use App\Http\Controllers\Api\WompiMembershipController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', [HealthController::class, 'live']);
Route::get('/ready', [HealthController::class, 'ready']);
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');
Route::post('/payments/wompi/webhook', [WompiMembershipController::class, 'webhook'])
    ->middleware('throttle:120,1');

Route::middleware(['auth:sanctum', 'account.active'])->get('/user', function (Request $request) {
    return $request->user();
});

Route::middleware('auth:sanctum')
    ->get('/account/export', [AuthController::class, 'exportAccountData'])
    ->middleware('throttle:6,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/email/verification-notification', [AuthController::class, 'resendVerification'])
        ->middleware('throttle:6,1');
});

Route::middleware(['auth:sanctum', 'account.active'])->group(function () {
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::post('/profile/photo', [AuthController::class, 'updateProfile']);
    Route::put('/auth/change-password', [AuthController::class, 'changePassword'])
        ->middleware('throttle:5,1');
    Route::get('/students/{id}', [ViajauController::class, 'showStudent']);
    Route::put('/students/{id}/profile', [ViajauController::class, 'updateProfile']);

    Route::middleware('verified')->group(function () {
        Route::get('/membership', [MembershipController::class, 'show']);
        Route::post('/membership/wompi/checkout', [WompiMembershipController::class, 'createCheckout'])
            ->middleware('throttle:5,1');
        Route::get('/insurance/products', [InsuranceController::class, 'products']);
        Route::get('/insurance/enrollments/mine', [InsuranceController::class, 'mine']);
        Route::post('/insurance/enrollments', [InsuranceController::class, 'requestQuote'])
            ->middleware('throttle:5,1');
        Route::post('/insurance/enrollments/{enrollment}/policy', [InsuranceController::class, 'submitPolicy'])
            ->middleware('throttle:5,1');
        Route::get('/communication/trips', [TripCommunicationController::class, 'trips']);
        Route::get('/trips/{trip}/messages', [TripCommunicationController::class, 'messages']);
        Route::post('/trips/{trip}/messages', [TripCommunicationController::class, 'sendMessage'])
            ->middleware('throttle:30,1');
        Route::get('/reputation/me', [ReputationController::class, 'mine']);
        Route::get('/reputation/profiles/{profile}', [ReputationController::class, 'profile']);
        Route::post('/trips/{trip}/reviews', [ReputationController::class, 'review'])
            ->middleware('throttle:10,1');
        Route::post('/trips/{trip}/reports', [ReputationController::class, 'report'])
            ->middleware('throttle:5,1');
        Route::get('/trips', [ViajauController::class, 'listTrips']);
        Route::post('/trips', [ViajauController::class, 'createTrip'])->middleware('throttle:10,1');
        Route::get('/trips/mine', [ViajauController::class, 'myTrips']);
        Route::post('/trips/{trip}/requests', [ViajauController::class, 'createTripRequest'])
            ->middleware('throttle:10,1');
        Route::patch('/trips/{trip}', [ViajauController::class, 'cancelTrip']);
        Route::post('/trips/{trip}/location', [TripSafetyController::class, 'shareTripLocation'])
            ->middleware('throttle:30,1');
        Route::delete('/trips/{trip}/location', [TripSafetyController::class, 'stopSharingTripLocation']);
        Route::get('/trips/{trip}/safety', [TripSafetyController::class, 'tripSafetyStatus']);
        Route::post('/trips/{trip}/check-ins', [TripSafetyController::class, 'createTripCheckIn'])
            ->middleware('throttle:10,1');
        Route::patch('/trip-requests/{tripRequest}', [ViajauController::class, 'updateTripRequest'])
            ->middleware('throttle:20,1');
        Route::get('/matches', [TravelMatchController::class, 'index']);
        Route::post('/alerts', [SafetyAlertController::class, 'store'])->middleware('throttle:3,1');
    });

    Route::middleware(['verified', 'role:admin,university'])->get('/dashboard', [ViajauController::class, 'dashboard']);
    Route::middleware(['verified', 'role:admin,university'])->prefix('admin')->group(function () {
        Route::get('/users', [AdminManagementController::class, 'users']);
        Route::patch('/users/{managedUser}', [AdminManagementController::class, 'updateUser']);
        Route::get('/incidents', [AdminManagementController::class, 'incidents']);
        Route::get('/catalog', [AdminManagementController::class, 'catalog']);
        Route::post('/catalog', [AdminManagementController::class, 'createCatalogEntry']);
        Route::patch('/catalog/{entry}', [AdminManagementController::class, 'updateCatalogEntry']);
        Route::delete('/catalog/{entry}', [AdminManagementController::class, 'deactivateCatalogEntry']);
    });
    Route::middleware(['verified', 'role:admin'])->prefix('admin')->group(function () {
        Route::get('/insurance/enrollments', [InsuranceController::class, 'adminIndex']);
        Route::patch('/insurance/enrollments/{enrollment}', [InsuranceController::class, 'updateEnrollment']);
        Route::get('/insurance/enrollments/{enrollment}/document', [InsuranceController::class, 'downloadPolicy']);
        Route::get('/reports', [ReputationController::class, 'reports']);
        Route::patch('/reports/{report}', [ReputationController::class, 'moderateReport']);
        Route::post('/transit-feed/import', [AdminManagementController::class, 'importTransitFeed'])
            ->middleware('throttle:3,1');
        Route::get('/transit-feed/latest', [AdminManagementController::class, 'latestTransitFeed']);
    });
    Route::middleware(['verified', 'role:security,admin'])->group(function () {
        Route::get('/security/alerts', [SafetyAlertController::class, 'index']);
        Route::patch('/security/alerts/{alert}/resolve', [SafetyAlertController::class, 'resolve']);
    });
});
