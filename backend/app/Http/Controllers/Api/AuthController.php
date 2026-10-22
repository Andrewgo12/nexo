<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentProfile;
use App\Models\User;
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
