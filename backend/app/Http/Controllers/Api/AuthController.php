<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InsuranceEnrollment;
use App\Models\MembershipPayment;
use App\Models\SafetyAlert;
use App\Models\SafetyNotificationDelivery;
use App\Models\StudentProfile;
use App\Models\TravelOffer;
use App\Models\TripCheckIn;
use App\Models\TripLocation;
use App\Models\TripMessage;
use App\Models\TripRequest;
use App\Models\TripReview;
use App\Models\TripSafetyEvent;
use App\Models\User;
use App\Models\UserReport;
use App\Services\StudentProfileUpdateService;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Throwable;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $this->ensureBrowserSession($request);
        $request->merge([
            'email' => strtolower(trim((string) $request->input('email'))),
        ]);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', PasswordRule::min(12)->letters()->numbers(), 'confirmed'],
            'university' => ['required', 'string', 'in:'.implode(',', array_keys(config('viajau.universities')))],
            'career' => ['nullable', 'string', 'max:120'],
            'semester' => ['nullable', 'string', 'max:40'],
            'shift' => ['nullable', 'string', 'max:40'],
            'neighborhood' => ['nullable', 'string', 'max:120'],
            'emergency_contact' => ['nullable', 'string', 'max:160'],
        ]);

        $email = strtolower(trim($data['email']));
        $university = config("viajau.universities.{$data['university']}");
        $emailDomain = substr(strrchr($email, '@') ?: '', 1);

        if ($emailDomain !== $university['domain']) {
            throw ValidationException::withMessages([
                'email' => ['El correo no pertenece al dominio de la universidad seleccionada.'],
            ]);
        }

        $user = DB::transaction(function () use ($data, $email, $university): User {
            $user = User::create([
                'name' => trim($data['name']),
                'email' => $email,
                'password' => $data['password'],
                'university' => $university['name'],
                'career' => $data['career'] ?? null,
                'semester' => $data['semester'] ?? null,
                'shift' => $data['shift'] ?? null,
                'neighborhood' => $data['neighborhood'] ?? null,
                'emergency_contact' => $data['emergency_contact'] ?? null,
                'role' => 'student',
                'status' => User::STATUS_PENDING,
            ]);

            $profile = StudentProfile::firstOrNew(['email' => $email]);
            $profile->fill([
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'university' => $user->university,
                'career' => $user->career,
                'semester' => $user->semester,
                'shift' => $user->shift,
                'neighborhood' => $user->neighborhood,
                'emergency_contact' => $user->emergency_contact,
                'verified' => false,
                'status' => 'pendiente-verificacion',
            ]);
            $profile->save();

            return $user;
        });
        $token = $this->authenticateClient($request, $user);
        $verificationEmailSent = $this->sendVerificationNotification($user);

        return response()->json([
            'message' => $verificationEmailSent
                ? 'Cuenta creada. Revisa tu correo institucional para verificarla.'
                : 'Cuenta creada, pero no se pudo enviar el correo. Solicita un nuevo enlace desde tu cuenta.',
            ...($token ? ['token' => $token] : []),
            'verification_email_sent' => $verificationEmailSent,
            'user' => $user,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $this->ensureBrowserSession($request);
        $request->merge([
            'email' => strtolower(trim((string) $request->input('email'))),
        ]);
        $data = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['sometimes', 'boolean'],
        ]);

        $limiterKey = 'login:'.hash('sha256', $data['email'].'|'.$request->ip());
        if (RateLimiter::tooManyAttempts($limiterKey, 5)) {
            return response()->json([
                'message' => 'Demasiados intentos fallidos. Espera antes de volver a intentar.',
            ], 429, [
                'Retry-After' => RateLimiter::availableIn($limiterKey),
            ]);
        }

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            RateLimiter::hit($limiterKey, 60);

            return response()->json([
                'message' => 'Las credenciales no son válidas.',
            ], 422);
        }

        if (
            ! in_array($user->role, User::ROLES, true) ||
            ! in_array($user->status, [User::STATUS_ACTIVE, User::STATUS_PENDING, User::STATUS_BLOCKED], true)
        ) {
            return response()->json(['message' => 'La cuenta tiene un estado o rol no válido.'], 403);
        }

        if ($user->status === User::STATUS_BLOCKED) {
            return response()->json(['message' => 'La cuenta está bloqueada. Contacta al equipo de soporte.'], 403);
        }

        RateLimiter::clear($limiterKey);
        $token = $this->authenticateClient($request, $user, (bool) ($data['remember'] ?? false));

        return response()->json([
            'message' => 'Sesión iniciada correctamente.',
            ...($token ? ['token' => $token] : []),
            'user' => $user,
        ]);
    }

    private function ensureBrowserSession(Request $request): void
    {
        $isBrowserRequest = $request->headers->has('origin') || $request->headers->has('referer');
        abort_if(
            $isBrowserRequest && ! $request->hasSession(),
            400,
            'La sesión de navegador no está configurada como una solicitud de primera parte.',
        );
    }

    private function authenticateClient(Request $request, User $user, bool $remember = false): ?string
    {
        if (! $request->hasSession()) {
            return $user->createToken('api')->plainTextToken;
        }

        Auth::guard('web')->login($user, $remember);
        $request->session()->regenerate();
        $request->session()->put('auth_version', $user->auth_version);

        return null;
    }

    public function logout(Request $request): JsonResponse
    {
        $accessToken = $request->user()->currentAccessToken();
        if ($accessToken instanceof PersonalAccessToken) {
            $accessToken->delete();
        }
        if ($request->hasSession()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['message' => 'Sesión cerrada correctamente.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user()]);
    }

    public function exportAccountData(Request $request): JsonResponse
    {
        $user = $request->user();
        $profile = $user->studentProfile;
        $travelOffers = $profile
            ? TravelOffer::query()
                ->where('student_profile_id', $profile->id)
                ->orderBy('id')
                ->get([
                    'origin',
                    'destination',
                    'mode',
                    'departure_date',
                    'departure_time',
                    'seats',
                    'cost',
                    'status',
                    'safety_route',
                    'created_at',
                    'updated_at',
                ])
            : collect();
        $tripRequests = $profile
            ? TripRequest::query()
                ->join('travel_offers', 'travel_offers.id', '=', 'trip_requests.travel_offer_id')
                ->where('trip_requests.requester_profile_id', $profile->id)
                ->orderBy('trip_requests.id')
                ->get([
                    'trip_requests.status',
                    'trip_requests.created_at',
                    'trip_requests.updated_at',
                    'travel_offers.origin',
                    'travel_offers.destination',
                    'travel_offers.mode',
                    'travel_offers.departure_date',
                    'travel_offers.departure_time',
                ])
            : collect();
        $receivedTripRequests = $profile
            ? TripRequest::query()
                ->join('travel_offers', 'travel_offers.id', '=', 'trip_requests.travel_offer_id')
                ->where('travel_offers.student_profile_id', $profile->id)
                ->orderBy('trip_requests.id')
                ->get([
                    'trip_requests.status',
                    'trip_requests.created_at',
                    'trip_requests.updated_at',
                    'travel_offers.origin',
                    'travel_offers.destination',
                    'travel_offers.mode',
                    'travel_offers.departure_date',
                    'travel_offers.departure_time',
                ])
            : collect();
        $reviewsWritten = $profile
            ? TripReview::query()
                ->join('travel_offers', 'travel_offers.id', '=', 'trip_reviews.travel_offer_id')
                ->where('trip_reviews.reviewer_profile_id', $profile->id)
                ->orderBy('trip_reviews.id')
                ->get([
                    'trip_reviews.rating',
                    'trip_reviews.comment',
                    'trip_reviews.created_at',
                    'travel_offers.origin',
                    'travel_offers.destination',
                    'travel_offers.departure_date',
                ])
            : collect();
        $reviewsReceived = $profile
            ? TripReview::query()
                ->join('travel_offers', 'travel_offers.id', '=', 'trip_reviews.travel_offer_id')
                ->where('trip_reviews.reviewee_profile_id', $profile->id)
                ->orderBy('trip_reviews.id')
                ->get([
                    'trip_reviews.rating',
                    'trip_reviews.created_at',
                    'travel_offers.origin',
                    'travel_offers.destination',
                    'travel_offers.departure_date',
                ])
            : collect();
        $messagesWritten = $profile
            ? TripMessage::query()
                ->join('travel_offers', 'travel_offers.id', '=', 'trip_messages.travel_offer_id')
                ->where('trip_messages.sender_profile_id', $profile->id)
                ->orderBy('trip_messages.id')
                ->get([
                    'trip_messages.body',
                    'trip_messages.created_at',
                    'travel_offers.origin',
                    'travel_offers.destination',
                    'travel_offers.departure_date',
                ])
            : collect();
        $safetyAlerts = $profile
            ? SafetyAlert::query()
                ->where('student_profile_id', $profile->id)
                ->orderBy('id')
                ->get([
                    'type',
                    'severity',
                    'message',
                    'active',
                    'location',
                    'latitude',
                    'longitude',
                    'accuracy_meters',
                    'resolved_at',
                    'created_at',
                    'updated_at',
                ])
            : collect();
        $tripSafetyEvents = TripSafetyEvent::query()
            ->where('user_id', $user->id)
            ->orderBy('id')
            ->get(['type', 'occurred_at']);
        $safetyNotificationDeliveries = SafetyNotificationDelivery::query()
            ->join('trip_safety_events', 'trip_safety_events.id', '=', 'safety_notification_deliveries.trip_safety_event_id')
            ->where('trip_safety_events.user_id', $user->id)
            ->orderBy('safety_notification_deliveries.id')
            ->get([
                'safety_notification_deliveries.channel',
                'safety_notification_deliveries.status',
                'safety_notification_deliveries.sent_at',
                'trip_safety_events.type as event_type',
                'trip_safety_events.occurred_at',
            ]);
        $tripCheckIns = TripCheckIn::query()
            ->where('user_id', $user->id)
            ->orderBy('id')
            ->get(['type', 'checked_in_at']);
        $tripLocations = TripLocation::query()
            ->where('user_id', $user->id)
            ->orderBy('captured_at')
            ->get(['latitude', 'longitude', 'accuracy_meters', 'captured_at']);
        $reportsWritten = $profile
            ? UserReport::query()
                ->join('travel_offers', 'travel_offers.id', '=', 'user_reports.travel_offer_id')
                ->where('user_reports.reporter_profile_id', $profile->id)
                ->orderBy('user_reports.id')
                ->get([
                    'user_reports.category',
                    'user_reports.status',
                    'user_reports.created_at',
                    'user_reports.updated_at',
                    'user_reports.resolved_at',
                    'travel_offers.origin',
                    'travel_offers.destination',
                    'travel_offers.departure_date',
                ])
            : collect();
        $insuranceEnrollments = InsuranceEnrollment::query()
            ->where('user_id', $user->id)
            ->orderBy('id')
            ->get([
                'product_key',
                'provider',
                'product_name',
                'monthly_premium_cop',
                'coverage_summary',
                'coverage_starts_at',
                'coverage_ends_at',
                'status',
                'created_at',
                'updated_at',
            ]);
        $membershipPayments = MembershipPayment::query()
            ->where('user_id', $user->id)
            ->orderBy('id')
            ->get([
                'provider',
                'reference',
                'amount_in_cents',
                'currency',
                'status',
                'environment',
                'gateway_updated_at',
                'created_at',
                'updated_at',
            ]);

        return response()->json([
            'data' => [
                'format_version' => 1,
                'exported_at' => now()->toISOString(),
                'account' => $user->only([
                    'id',
                    'name',
                    'email',
                    'email_verified_at',
                    'university',
                    'career',
                    'semester',
                    'shift',
                    'neighborhood',
                    'emergency_contact',
                    'trusted_contact_email',
                    'trusted_contact_phone',
                    'trusted_contact_consent',
                    'trusted_contact_consent_at',
                    'role',
                    'status',
                    'created_at',
                    'updated_at',
                ]),
                'student_profile' => $profile?->only([
                    'id',
                    'name',
                    'email',
                    'university',
                    'career',
                    'semester',
                    'shift',
                    'neighborhood',
                    'transport',
                    'emergency_contact',
                    'privacy',
                    'verified',
                    'trust_score',
                    'status',
                    'created_at',
                    'updated_at',
                ]),
                'travel_offers' => $travelOffers,
                'trip_requests' => $tripRequests,
                'received_trip_requests' => $receivedTripRequests,
                'reviews_written' => $reviewsWritten,
                'reviews_received' => $reviewsReceived,
                'messages_written' => $messagesWritten,
                'safety_alerts' => $safetyAlerts,
                'trip_safety_events' => $tripSafetyEvents,
                'safety_notification_deliveries' => $safetyNotificationDeliveries,
                'trip_check_ins' => $tripCheckIns,
                'trip_locations' => $tripLocations,
                'reports_written' => $reportsWritten,
                'insurance_enrollments' => $insuranceEnrollments,
                'membership_payments' => $membershipPayments,
            ],
        ], 200, [
            'Cache-Control' => 'no-store, private',
            'Pragma' => 'no-cache',
        ]);
    }

    public function updateProfile(Request $request, StudentProfileUpdateService $profileUpdater): JsonResponse
    {
        $data = $request->validate([
            ...$profileUpdater->validationRules(),
            'photo' => ['sometimes', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);
        $user = $request->user();
        $newPhotoPath = null;
        $oldPhotoPath = $user->profile_photo_path;
        if ($request->hasFile('photo')) {
            $newPhotoPath = $request->file('photo')->store('profile-photos', 'public');
            abort_unless(is_string($newPhotoPath), 500, 'No fue posible guardar la foto de perfil.');
            $user->profile_photo_path = $newPhotoPath;
        }
        try {
            $profileUpdater->update($user, $data);
        } catch (Throwable $exception) {
            if ($newPhotoPath !== null) {
                try {
                    if (! Storage::disk('public')->delete($newPhotoPath)) {
                        Log::error('Failed to remove an uncommitted profile photo.', [
                            'user_id' => $user->id,
                            'path' => $newPhotoPath,
                            'exception' => $exception->getMessage(),
                        ]);
                    }
                } catch (Throwable $cleanupException) {
                    Log::error('Failed to remove an uncommitted profile photo.', [
                        'user_id' => $user->id,
                        'path' => $newPhotoPath,
                        'exception' => $cleanupException->getMessage(),
                    ]);
                }
            }
            throw $exception;
        }

        if ($newPhotoPath !== null && $oldPhotoPath) {
            try {
                if (! Storage::disk('public')->delete($oldPhotoPath)) {
                    Log::warning('Failed to remove a replaced profile photo.', [
                        'user_id' => $user->id,
                        'path' => $oldPhotoPath,
                    ]);
                }
            } catch (Throwable $exception) {
                Log::error('Failed to remove a replaced profile photo.', [
                    'user_id' => $user->id,
                    'path' => $oldPhotoPath,
                    'exception' => $exception->getMessage(),
                ]);
            }
        }

        return response()->json([
            'message' => 'Perfil actualizado correctamente.',
            'user' => $user->fresh(),
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', PasswordRule::min(12)->letters()->numbers(), 'confirmed'],
        ]);
        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['La contraseña actual no es correcta.'],
            ]);
        }

        $user->forceFill([
            'password' => $data['password'],
            'auth_version' => $user->auth_version + 1,
        ])->save();
        $currentAccessToken = $user->currentAccessToken();
        if ($currentAccessToken instanceof PersonalAccessToken) {
            $user->tokens()->where('id', '!=', $currentAccessToken->getKey())->delete();
        } else {
            $user->tokens()->delete();
        }
        if ($request->hasSession()) {
            $request->session()->regenerate();
            $request->session()->put('auth_version', $user->fresh()->auth_version);
        }

        return response()->json(['message' => 'Contraseña actualizada correctamente.']);
    }

    public function resendVerification(Request $request): JsonResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'El correo ya está verificado.',
                'verification_email_sent' => false,
            ]);
        }

        $sent = $this->sendVerificationNotification($request->user());
        if (! $sent) {
            return response()->json([
                'message' => 'No fue posible enviar el correo de verificación. Inténtalo de nuevo más tarde.',
                'verification_email_sent' => false,
            ], 503);
        }

        return response()->json([
            'message' => 'Enviamos un nuevo enlace de verificación.',
            'verification_email_sent' => true,
        ]);
    }

    private function sendVerificationNotification(User $user): bool
    {
        try {
            $user->sendEmailVerificationNotification();

            return true;
        } catch (TransportExceptionInterface $exception) {
            Log::warning('Email verification notification could not be delivered.', [
                'user_id' => $user->id,
                'exception' => $exception::class,
            ]);

            return false;
        }
    }

    public function verifyEmail(string $id, string $hash)
    {
        $user = User::findOrFail($id);

        abort_unless(hash_equals(sha1($user->getEmailForVerification()), $hash), 403);

        DB::transaction(function () use ($user): void {
            $lockedUser = User::query()->lockForUpdate()->findOrFail($user->id);
            abort_unless(
                in_array($lockedUser->status, [User::STATUS_PENDING, User::STATUS_ACTIVE], true),
                403,
                'La cuenta no puede activarse con este enlace.',
            );

            if (! $lockedUser->hasVerifiedEmail()) {
                $lockedUser->markEmailAsVerified();
            }

            if ($lockedUser->status === User::STATUS_PENDING) {
                $lockedUser->forceFill(['status' => User::STATUS_ACTIVE])->save();
            }

            $lockedUser->studentProfile()->update([
                'verified' => true,
                'status' => 'activo',
            ]);
        });

        return redirect()->away(config('viajau.frontend_url').'?verified=1');
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'email'],
        ]);

        Password::sendResetLink([
            'email' => strtolower(trim($data['email'])),
        ]);

        return response()->json([
            'message' => 'Si existe una cuenta con ese correo, recibirás instrucciones para restablecer la contraseña.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string', PasswordRule::min(12)->letters()->numbers(), 'confirmed'],
        ]);

        $status = Password::reset(
            [
                ...$data,
                'email' => strtolower(trim($data['email'])),
            ],
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                    'auth_version' => $user->auth_version + 1,
                ])->save();
                $user->tokens()->delete();
                event(new PasswordReset($user));
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => ['El enlace no es válido o ya venció. Solicita uno nuevo.'],
            ]);
        }

        return response()->json(['message' => 'Contraseña actualizada. Inicia sesión con tu nueva contraseña.']);
    }
}
