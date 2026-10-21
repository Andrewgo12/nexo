<?php

namespace Tests\Feature;

use App\Http\Middleware\RequireHttpsInProduction;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_register_with_a_matching_university_domain(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Ana López',
            'email' => 'ANA@UNIAJC.EDU.CO',
            'password' => 'Estudiante2026!',
            'password_confirmation' => 'Estudiante2026!',
            'university' => 'uniajc',
            'career' => 'Ingeniería',
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.email', 'ana@uniajc.edu.co')
            ->assertJsonMissingPath('user.password')
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'role', 'status']]);

        $user = User::firstOrFail();
        $this->assertTrue(Hash::check('Estudiante2026!', $user->password));
        $this->assertSame('student', $user->role);
        $this->assertSame(User::STATUS_PENDING, $user->status);
        $this->assertSame($user->id, StudentProfile::firstOrFail()->user_id);
        $this->assertFalse(StudentProfile::firstOrFail()->verified);
        Notification::assertSentTo($user, VerifyEmail::class);
        $this->withToken($response->json('token'))->getJson('/api/trips')->assertForbidden();
    }

    public function test_registration_rejects_an_email_from_another_university(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Ana López',
            'email' => 'ana@icesi.edu.co',
            'password' => 'Estudiante2026!',
            'password_confirmation' => 'Estudiante2026!',
            'university' => 'uniajc',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('email');

        $this->assertDatabaseCount('users', 0);
    }

    public function test_registration_rejects_duplicate_email_on_the_requested_alias(): void
    {
        User::factory()->create(['email' => 'ana@uniajc.edu.co']);

        $this->postJson('/api/register', [
            'name' => 'Ana López',
            'email' => 'ANA@UNIAJC.EDU.CO',
            'password' => 'Estudiante2026!',
            'password_confirmation' => 'Estudiante2026!',
            'university' => 'uniajc',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('email');

        $this->assertDatabaseCount('users', 1);
    }

    public function test_student_can_log_in_and_revoke_their_token(): void
    {
        $user = User::factory()->create([
            'email' => 'ana@uniajc.edu.co',
            'password' => Hash::make('Estudiante2026!'),
        ]);

        $login = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'Estudiante2026!',
        ])->assertOk()->assertJsonStructure(['token', 'user']);

        $token = $login->json('token');

        $this->withToken($token)->getJson('/api/auth/me')->assertOk()
            ->assertJsonPath('user.id', $user->id);

        $this->withToken($token)->postJson('/api/auth/logout')->assertOk();
        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_private_routes_reject_requests_without_a_token(): void
    {
        $this->getJson('/api/auth/me')->assertUnauthorized();
        $this->getJson('/api/me')->assertUnauthorized();
        $this->getJson('/api/auth/me', ['Authorization' => 'Bearer invalid-token'])->assertUnauthorized();
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'ana@uniajc.edu.co',
            'password' => Hash::make('Estudiante2026!'),
        ]);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ])->assertUnprocessable()
            ->assertJsonPath('message', 'Las credenciales no son válidas.');
    }

    public function test_login_locks_out_after_five_failed_attempts(): void
    {
        $user = User::factory()->create([
            'email' => 'ana@uniajc.edu.co',
            'password' => Hash::make('Estudiante2026!'),
        ]);

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/login', [
                'email' => $user->email,
                'password' => 'incorrecta',
            ])->assertUnprocessable();
        }

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'Estudiante2026!',
        ])->assertStatus(429)
            ->assertJsonPath('message', 'Demasiados intentos fallidos. Espera antes de volver a intentar.')
            ->assertHeader('Retry-After');
    }

    public function test_blocked_accounts_cannot_log_in(): void
    {
        $user = User::factory()->create([
            'email' => 'ana@uniajc.edu.co',
            'password' => Hash::make('Estudiante2026!'),
            'status' => User::STATUS_BLOCKED,
        ]);

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'Estudiante2026!',
        ])->assertForbidden();
    }

    public function test_accounts_with_unknown_roles_cannot_log_in(): void
    {
        $user = User::factory()->create([
            'email' => 'ana@uniajc.edu.co',
            'password' => Hash::make('Estudiante2026!'),
            'role' => 'super-admin',
        ]);

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'Estudiante2026!',
        ])->assertForbidden();
    }

    public function test_registration_login_me_and_logout_aliases_work(): void
    {
        Notification::fake();
        $registration = $this->postJson('/api/register', [
            'name' => 'Ana López',
            'email' => 'ana@uniajc.edu.co',
            'password' => 'Estudiante2026!',
            'password_confirmation' => 'Estudiante2026!',
            'university' => 'uniajc',
        ])->assertCreated();
        $user = User::firstOrFail();

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'Estudiante2026!',
        ])->assertOk()->assertJsonPath('user.id', $user->id);

        $token = $registration->json('token');
        $this->withToken($token)->getJson('/api/me')->assertOk()
            ->assertJsonPath('user.email', $user->email);
        $this->withToken($token)->postJson('/api/logout')->assertOk();
        $this->assertSame(1, $user->tokens()->count());
    }

    public function test_login_allows_pending_accounts_to_verify_email_but_not_blocked_accounts(): void
    {
        $user = User::factory()->create([
            'email' => 'ana@uniajc.edu.co',
            'password' => Hash::make('Estudiante2026!'),
            'status' => User::STATUS_PENDING,
            'email_verified_at' => null,
        ]);

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'Estudiante2026!',
        ])->assertOk()->assertJsonPath('user.status', User::STATUS_PENDING);
    }

    public function test_signed_verification_link_activates_the_student_profile(): void
    {
        $user = User::factory()->create([
            'email' => 'ana@uniajc.edu.co',
            'university' => 'UNIAJC',
        ]);
        $profile = StudentProfile::create([
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'university' => 'UNIAJC',
            'verified' => false,
            'status' => 'pendiente-verificacion',
        ]);
        $url = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->email)],
        );

        $this->get($url)->assertRedirect(config('viajau.frontend_url').'?verified=1');

        $this->assertNotNull($user->fresh()->email_verified_at);
        $this->assertSame(User::STATUS_ACTIVE, $user->fresh()->status);
        $this->assertTrue($profile->fresh()->verified);
        $this->assertSame('activo', $profile->fresh()->status);
    }

    public function test_forgot_password_sends_a_reset_link_and_reset_revokes_existing_tokens(): void
    {
        Notification::fake();
        $user = User::factory()->create([
            'email' => 'ana@uniajc.edu.co',
            'password' => Hash::make('Estudiante2026!'),
        ]);
        $accessToken = $user->createToken('web');
        $resetToken = null;

        $this->postJson('/api/auth/forgot-password', ['email' => $user->email])
            ->assertOk()
            ->assertJsonPath('message', 'Si existe una cuenta con ese correo, recibirás instrucciones para restablecer la contraseña.');

        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use (&$resetToken): bool {
            $resetToken = $notification->token;

            return true;
        });
        $this->assertNotNull($resetToken);

        $this->postJson('/api/auth/reset-password', [
            'token' => $resetToken,
            'email' => $user->email,
            'password' => 'NuevaClave2026Segura',
            'password_confirmation' => 'NuevaClave2026Segura',
        ])->assertOk();

        $this->assertTrue(Hash::check('NuevaClave2026Segura', $user->fresh()->password));
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $accessToken->accessToken->id]);
    }

    public function test_supported_roles_are_defined_and_routes_are_restricted_by_role(): void
    {
        $this->assertSame(['student', 'admin', 'security', 'university'], User::ROLES);

        $student = User::factory()->create(['email_verified_at' => now()]);
        $studentToken = $student->createToken('web')->plainTextToken;

        $this->withToken($studentToken)->getJson('/api/dashboard')->assertForbidden();
        $this->app['auth']->forgetGuards();
        $this->withToken($studentToken)->getJson('/api/security/alerts')->assertForbidden();

        $admin = User::factory()->create([
            'role' => User::ROLE_ADMIN,
            'email_verified_at' => now(),
        ]);
        $adminToken = $admin->createToken('web')->plainTextToken;

        $this->app['auth']->forgetGuards();
        $this->withToken($adminToken)->getJson('/api/dashboard')->assertOk();

        $security = User::factory()->create([
            'role' => User::ROLE_SECURITY,
            'email_verified_at' => now(),
        ]);
        $securityToken = $security->createToken('web')->plainTextToken;

        $this->app['auth']->forgetGuards();
        $this->withToken($securityToken)->getJson('/api/security/alerts')->assertOk();
        $this->app['auth']->forgetGuards();
        $this->withToken($securityToken)->getJson('/api/dashboard')->assertForbidden();

        $university = User::factory()->create([
            'role' => User::ROLE_UNIVERSITY,
            'email_verified_at' => now(),
        ]);
        $universityToken = $university->createToken('web')->plainTextToken;

        $this->app['auth']->forgetGuards();
        $this->withToken($universityToken)->getJson('/api/dashboard')->assertOk();
    }

    public function test_user_can_update_their_profile_without_changing_verification_or_role(): void
    {
        $user = User::factory()->create([
            'email' => 'ana@uniajc.edu.co',
            'email_verified_at' => now(),
        ]);
        $profile = StudentProfile::create([
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'university' => 'UNIAJC',
            'verified' => true,
            'status' => 'activo',
        ]);
        $token = $user->createToken('web')->plainTextToken;

        $this->withToken($token)->putJson('/api/auth/profile', [
            'name' => 'Ana Pérez',
            'email' => 'atacante@icesi.edu.co',
            'verified' => false,
            'role' => 'admin',
            'career' => 'Diseño',
        ])->assertOk()->assertJsonPath('user.name', 'Ana Pérez');

        $this->assertSame('ana@uniajc.edu.co', $user->fresh()->email);
        $this->assertSame('student', $user->fresh()->role);
        $this->assertNotNull($user->fresh()->email_verified_at);
        $this->assertTrue($profile->fresh()->verified);
        $this->assertSame('Diseño', $profile->fresh()->career);
    }

    public function test_user_can_change_their_password_and_keep_the_current_session(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('Estudiante2026!'),
        ]);
        $token = $user->createToken('web')->plainTextToken;

        $this->withToken($token)->putJson('/api/auth/change-password', [
            'current_password' => 'Estudiante2026!',
            'password' => 'NuevaClave2026Segura',
            'password_confirmation' => 'NuevaClave2026Segura',
        ])->assertOk();

        $this->assertTrue(Hash::check('NuevaClave2026Segura', $user->fresh()->password));
        $this->assertSame(1, $user->tokens()->count());
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/auth/me')->assertOk();
    }

    public function test_student_cannot_create_a_trip_using_another_students_profile(): void
    {
        $student = User::factory()->create(['email_verified_at' => now()]);
        $ownProfile = StudentProfile::create([
            'user_id' => $student->id,
            'name' => $student->name,
            'email' => $student->email,
            'university' => 'UNIAJC',
            'verified' => true,
        ]);
        $otherStudent = User::factory()->create();
        $otherProfile = StudentProfile::create([
            'user_id' => $otherStudent->id,
            'name' => $otherStudent->name,
            'email' => $otherStudent->email,
            'university' => 'UNIAJC',
        ]);
        $token = $student->createToken('web')->plainTextToken;

        $this->withToken($token)->postJson('/api/trips', [
            'student_profile_id' => $otherProfile->id,
            'origin' => 'Universidad',
            'destination' => 'Casa',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('student_profile_id');

        $this->assertDatabaseCount('travel_offers', 0);
        $this->assertDatabaseHas('student_profiles', ['id' => $ownProfile->id]);
    }

    public function test_user_can_upload_a_profile_photo(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $token = $user->createToken('web')->plainTextToken;
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l0sAAAAASUVORK5CYII=');

        $response = $this->withToken($token)->post('/api/profile/photo', [
            'photo' => UploadedFile::fake()->createWithContent('avatar.png', $png),
        ], ['Accept' => 'application/json']);

        $response->assertOk()
            ->assertJsonStructure(['user' => ['photo_url']]);
        $this->assertStringContainsString('profile-photos/', $response->json('user.photo_url'));
        Storage::disk('public')->assertExists($user->fresh()->profile_photo_path);
    }

    public function test_production_http_requests_are_rejected_and_https_requests_are_allowed(): void
    {
        $this->app['env'] = 'production';

        $this->getJson('/api/health')->assertStatus(400)
            ->assertJsonPath('message', 'Esta aplicación requiere una conexión HTTPS segura.');

        $secureRequest = Request::create('https://localhost/api/health');
        $secureResponse = app(RequireHttpsInProduction::class)->handle(
            $secureRequest,
            fn () => response()->json(['status' => 'ok']),
        );
        $this->assertSame(200, $secureResponse->getStatusCode());
    }
}
