<?php

namespace Tests\Feature;

use App\Http\Middleware\RequireHttpsInProduction;
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
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Symfony\Component\Mailer\Exception\TransportException;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Referer' => 'http://localhost:5173/',
        ]);
    }

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
            ->assertJsonPath('verification_email_sent', true)
            ->assertJsonMissingPath('user.password')
            ->assertJsonMissingPath('token')
            ->assertJsonStructure(['user' => ['id', 'name', 'email', 'role', 'status']]);

        $user = User::firstOrFail();
        $this->assertTrue(Hash::check('Estudiante2026!', $user->password));
        $this->assertSame('student', $user->role);
        $this->assertSame(User::STATUS_PENDING, $user->status);
        $this->assertSame($user->id, StudentProfile::firstOrFail()->user_id);
        $this->assertFalse(StudentProfile::firstOrFail()->verified);
        Notification::assertSentTo($user, VerifyEmail::class);
        $sessionCookie = $response->getCookie(config('session.cookie'), false);
        $this->assertNotNull($sessionCookie);
        $this->withCookie(config('session.cookie'), $sessionCookie->getValue())
            ->getJson('/api/trips')->assertForbidden();
    }

    public function test_registration_can_retry_verification_email_after_a_transport_failure(): void
    {
        $notificationAttempts = 0;
        Notification::shouldReceive('send')->twice()->andReturnUsing(
            function () use (&$notificationAttempts): void {
                $notificationAttempts++;
                if ($notificationAttempts === 1) {
                    throw new TransportException('SMTP unavailable');
                }
            },
        );
        Log::shouldReceive('warning')->once();

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Ana López',
            'email' => 'ana@uniajc.edu.co',
            'password' => 'Estudiante2026!',
            'password_confirmation' => 'Estudiante2026!',
            'university' => 'uniajc',
        ])->assertCreated()
            ->assertJsonPath('verification_email_sent', false)
            ->assertJsonPath(
                'message',
                'Cuenta creada, pero no se pudo enviar el correo. Solicita un nuevo enlace desde tu cuenta.',
            );

        $this->assertDatabaseCount('users', 1);
        $user = User::firstOrFail();
        $this->assertSame(User::STATUS_PENDING, $user->status);
        $sessionCookie = $response->getCookie(config('session.cookie'), false);
        $this->assertNotNull($sessionCookie);

        $this->withCookie(config('session.cookie'), $sessionCookie->getValue())
            ->postJson('/api/auth/email/verification-notification')->assertOk()
            ->assertJsonPath('verification_email_sent', true)
            ->assertJsonPath('message', 'Enviamos un nuevo enlace de verificación.');
        $this->assertSame(2, $notificationAttempts);
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

    public function test_student_can_log_in_and_revoke_their_session(): void
    {
        $user = User::factory()->create([
            'email' => 'ana@uniajc.edu.co',
            'password' => Hash::make('Estudiante2026!'),
        ]);

        $login = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'Estudiante2026!',
        ])->assertOk()->assertJsonMissingPath('token')->assertJsonStructure(['user']);

        $sessionCookie = $login->getCookie(config('session.cookie'), false);
        $this->assertNotNull($sessionCookie);
        $this->assertTrue($sessionCookie->isHttpOnly());
        $this->assertDatabaseCount('personal_access_tokens', 0);

        $this->withCookie(config('session.cookie'), $sessionCookie->getValue())
            ->getJson('/api/auth/me')->assertOk()
            ->assertJsonPath('user.id', $user->id);

        $this->withCookie(config('session.cookie'), $sessionCookie->getValue())
            ->postJson('/api/auth/logout')->assertOk();
        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->app['auth']->forgetGuards();
        $this->withCookie(config('session.cookie'), $sessionCookie->getValue())
            ->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_non_browser_api_client_can_receive_and_revoke_a_personal_access_token(): void
    {
        $user = User::factory()->create([
            'email' => 'api@uniajc.edu.co',
            'password' => Hash::make('Estudiante2026!'),
        ]);

        $login = $this->withoutHeaders(['Origin', 'Referer'])
            ->postJson('/api/login', [
                'email' => $user->email,
                'password' => 'Estudiante2026!',
            ])->assertOk()->assertJsonStructure(['token', 'user']);
        $token = $login->json('token');

        $this->withToken($token)->getJson('/api/auth/me')->assertOk()
            ->assertJsonPath('user.id', $user->id);
        $this->withToken($token)->postJson('/api/auth/logout')->assertOk();
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_untrusted_browser_origin_cannot_fall_back_to_a_bearer_token(): void
    {
        $user = User::factory()->create([
            'email' => 'browser@uniajc.edu.co',
            'password' => Hash::make('Estudiante2026!'),
        ]);

        $this->withHeaders([
            'Origin' => 'https://attacker.example',
            'Referer' => 'https://attacker.example/',
        ])->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'Estudiante2026!',
        ])->assertStatus(400);

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_private_routes_reject_requests_without_a_token(): void
    {
        $this->getJson('/api/auth/me')->assertUnauthorized();
        $this->getJson('/api/me')->assertUnauthorized();
        $this->getJson('/api/auth/me', ['Authorization' => 'Bearer invalid-token'])->assertUnauthorized();
    }

    public function test_account_export_requires_authentication(): void
    {
        $this->getJson('/api/account/export')->assertUnauthorized();
    }

    public function test_authenticated_pending_and_blocked_accounts_can_export_their_own_data(): void
    {
        $user = User::factory()->create(['status' => User::STATUS_PENDING]);

        $this->actingAs($user, 'sanctum')->getJson('/api/account/export')
            ->assertOk()
            ->assertJsonPath('data.account.status', User::STATUS_PENDING);

        $user->update(['status' => User::STATUS_BLOCKED]);

        $this->actingAs($user, 'sanctum')->getJson('/api/account/export')
            ->assertOk()
            ->assertJsonPath('data.account.status', User::STATUS_BLOCKED);
    }

    public function test_active_account_without_a_student_profile_receives_empty_activity_sections(): void
    {
        $user = User::factory()->create([
            'role' => User::ROLE_ADMIN,
            'status' => User::STATUS_ACTIVE,
        ]);

        $this->actingAs($user, 'sanctum')->getJson('/api/account/export')
            ->assertOk()
            ->assertJsonPath('data.student_profile', null)
            ->assertJsonPath('data.travel_offers', [])
            ->assertJsonPath('data.trip_requests', [])
            ->assertJsonPath('data.received_trip_requests', [])
            ->assertJsonPath('data.reviews_written', [])
            ->assertJsonPath('data.reviews_received', [])
            ->assertJsonPath('data.messages_written', [])
            ->assertJsonPath('data.safety_alerts', [])
            ->assertJsonPath('data.trip_safety_events', [])
            ->assertJsonPath('data.safety_notification_deliveries', [])
            ->assertJsonPath('data.trip_check_ins', [])
            ->assertJsonPath('data.trip_locations', [])
            ->assertJsonPath('data.reports_written', [])
            ->assertJsonPath('data.insurance_enrollments', [])
            ->assertJsonPath('data.membership_payments', []);
    }

    public function test_account_export_returns_only_the_authenticated_users_account_and_profile_without_credentials(): void
    {
        $user = User::factory()->create([
            'name' => 'Ana',
            'email' => 'ana@uniajc.edu.co',
            'university' => 'UNIAJC',
            'career' => 'Ingeniería',
            'emergency_contact' => 'Contacto propio',
            'trusted_contact_phone' => '3000000000',
            'status' => User::STATUS_ACTIVE,
        ]);
        $profile = StudentProfile::create([
            'user_id' => $user->id,
            'name' => 'Ana',
            'email' => $user->email,
            'university' => 'UNIAJC',
            'career' => 'Ingeniería',
            'emergency_contact' => 'Contacto propio',
            'verified' => true,
            'status' => 'activo',
        ]);
        $otherUser = User::factory()->create(['email' => 'other@uniajc.edu.co']);
        StudentProfile::create([
            'user_id' => $otherUser->id,
            'name' => 'Otro perfil',
            'email' => $otherUser->email,
            'university' => 'UNIAJC',
            'verified' => true,
            'status' => 'activo',
        ]);
        $otherProfile = StudentProfile::where('user_id', $otherUser->id)->firstOrFail();
        $ownOffer = TravelOffer::create([
            'student_profile_id' => $profile->id,
            'origin' => 'El Caney',
            'destination' => 'Universidad',
            'departure_date' => now()->addDay()->toDateString(),
            'departure_time' => '08:30',
            'status' => 'oferta-activa',
        ]);
        $otherOffer = TravelOffer::create([
            'student_profile_id' => $otherProfile->id,
            'origin' => 'Centro',
            'destination' => 'Universidad',
            'departure_date' => now()->addDays(2)->toDateString(),
            'departure_time' => '09:30',
            'status' => 'oferta-activa',
        ]);
        TripRequest::create([
            'travel_offer_id' => $otherOffer->id,
            'requester_profile_id' => $profile->id,
            'status' => 'accepted',
        ]);
        TripRequest::create([
            'travel_offer_id' => $ownOffer->id,
            'requester_profile_id' => $otherProfile->id,
            'status' => 'pending',
        ]);
        TripReview::create([
            'travel_offer_id' => $otherOffer->id,
            'reviewer_profile_id' => $profile->id,
            'reviewee_profile_id' => $otherProfile->id,
            'rating' => 4,
            'comment' => 'Reseña escrita',
        ]);
        TripReview::create([
            'travel_offer_id' => $ownOffer->id,
            'reviewer_profile_id' => $otherProfile->id,
            'reviewee_profile_id' => $profile->id,
            'rating' => 5,
            'comment' => 'Reseña recibida',
        ]);
        TripMessage::create([
            'travel_offer_id' => $otherOffer->id,
            'sender_profile_id' => $profile->id,
            'body' => 'Mensaje escrito propio',
        ]);
        TripMessage::create([
            'travel_offer_id' => $ownOffer->id,
            'sender_profile_id' => $otherProfile->id,
            'body' => 'Mensaje ajeno',
        ]);
        SafetyAlert::create([
            'student_profile_id' => $profile->id,
            'type' => 'sos',
            'severity' => 'alta',
            'message' => 'Alerta propia',
            'active' => false,
            'location' => 'Ubicación privada',
            'latitude' => 3.451,
            'longitude' => -76.532,
            'resolved_at' => now(),
        ]);
        SafetyAlert::create([
            'student_profile_id' => $otherProfile->id,
            'type' => 'sos',
            'severity' => 'alta',
            'message' => 'Alerta de otra persona',
            'active' => true,
            'latitude' => 4.111,
            'longitude' => -75.1,
        ]);
        TripSafetyEvent::create([
            'travel_offer_id' => $ownOffer->id,
            'user_id' => $user->id,
            'type' => 'trip_started',
            'occurred_at' => now(),
        ]);
        $ownSafetyEvent = TripSafetyEvent::where('user_id', $user->id)->firstOrFail();
        SafetyNotificationDelivery::create([
            'trip_safety_event_id' => $ownSafetyEvent->id,
            'channel' => 'email',
            'status' => 'sent',
            'recipient_hash' => hash('sha256', 'trusted@example.edu'),
            'provider_message_id' => 'provider-private-id',
            'sent_at' => now(),
        ]);
        TripCheckIn::create([
            'travel_offer_id' => $ownOffer->id,
            'user_id' => $user->id,
            'type' => 'arrival',
            'checked_in_at' => now(),
        ]);
        TripCheckIn::create([
            'travel_offer_id' => $ownOffer->id,
            'user_id' => $otherUser->id,
            'type' => 'arrival',
            'checked_in_at' => now(),
        ]);
        TripLocation::create([
            'travel_offer_id' => $ownOffer->id,
            'user_id' => $user->id,
            'latitude' => 3.451,
            'longitude' => -76.532,
            'accuracy_meters' => 12,
            'captured_at' => now(),
        ]);
        TripLocation::create([
            'travel_offer_id' => $ownOffer->id,
            'user_id' => $otherUser->id,
            'latitude' => 4.111,
            'longitude' => -75.1,
            'accuracy_meters' => 8,
            'captured_at' => now(),
        ]);
        UserReport::create([
            'travel_offer_id' => $otherOffer->id,
            'reporter_profile_id' => $profile->id,
            'reported_profile_id' => $otherProfile->id,
            'category' => 'safety',
            'description' => 'Reporte propio',
            'status' => 'open',
        ]);
        UserReport::create([
            'travel_offer_id' => $ownOffer->id,
            'reporter_profile_id' => $otherProfile->id,
            'reported_profile_id' => $profile->id,
            'category' => 'safety',
            'description' => 'Reporte de otra persona',
            'status' => 'open',
        ]);
        InsuranceEnrollment::create([
            'user_id' => $user->id,
            'product_key' => 'student-basic',
            'provider' => 'Proveedor demo',
            'product_name' => 'Cobertura estudiantil',
            'monthly_premium_cop' => 15000,
            'coverage_summary' => 'Resumen de cobertura',
            'policy_number' => 'POLICY-PRIVATE-1',
            'policy_document_path' => 'private/policy.pdf',
            'review_note' => 'Nota privada del revisor',
            'status' => 'pending_review',
        ]);
        InsuranceEnrollment::create([
            'user_id' => $otherUser->id,
            'product_key' => 'other',
            'provider' => 'Proveedor ajeno',
            'product_name' => 'Producto ajeno',
            'status' => 'quoted',
        ]);
        MembershipPayment::create([
            'user_id' => $user->id,
            'provider' => 'wompi',
            'reference' => 'membership-own-reference',
            'amount_in_cents' => 250000,
            'currency' => 'COP',
            'status' => 'pending',
            'environment' => 'sandbox',
            'gateway_transaction_id' => 'gateway-private-transaction',
        ]);
        MembershipPayment::create([
            'user_id' => $otherUser->id,
            'provider' => 'wompi',
            'reference' => 'other-reference',
            'amount_in_cents' => 250000,
            'currency' => 'COP',
            'status' => 'pending',
            'environment' => 'sandbox',
        ]);
        TripSafetyEvent::create([
            'travel_offer_id' => $ownOffer->id,
            'user_id' => $otherUser->id,
            'type' => 'trip_started',
            'occurred_at' => now(),
        ]);
        $otherSafetyEvent = TripSafetyEvent::where('user_id', $otherUser->id)->firstOrFail();
        SafetyNotificationDelivery::create([
            'trip_safety_event_id' => $otherSafetyEvent->id,
            'channel' => 'sms',
            'status' => 'sent',
            'recipient_hash' => hash('sha256', 'other@example.edu'),
            'provider_message_id' => 'other-provider-private-id',
            'sent_at' => now(),
        ]);

        $this->actingAs($user, 'sanctum')->getJson('/api/account/export')
            ->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertHeader('Pragma', 'no-cache')
            ->assertJsonPath('data.format_version', 1)
            ->assertJsonPath('data.account.email', $user->email)
            ->assertJsonPath('data.account.emergency_contact', 'Contacto propio')
            ->assertJsonPath('data.student_profile.id', $profile->id)
            ->assertJsonPath('data.student_profile.email', $user->email)
            ->assertJsonCount(1, 'data.travel_offers')
            ->assertJsonPath('data.travel_offers.0.origin', 'El Caney')
            ->assertJsonCount(1, 'data.trip_requests')
            ->assertJsonPath('data.trip_requests.0.status', 'accepted')
            ->assertJsonMissingPath('data.trip_requests.0.requester_profile_id')
            ->assertJsonCount(1, 'data.received_trip_requests')
            ->assertJsonPath('data.received_trip_requests.0.status', 'pending')
            ->assertJsonMissingPath('data.received_trip_requests.0.requester_profile_id')
            ->assertJsonCount(1, 'data.reviews_written')
            ->assertJsonPath('data.reviews_written.0.comment', 'Reseña escrita')
            ->assertJsonMissingPath('data.reviews_written.0.reviewee_profile_id')
            ->assertJsonCount(1, 'data.reviews_received')
            ->assertJsonPath('data.reviews_received.0.rating', 5)
            ->assertJsonMissingPath('data.reviews_received.0.comment')
            ->assertJsonMissingPath('data.reviews_received.0.reviewer_profile_id')
            ->assertJsonCount(1, 'data.messages_written')
            ->assertJsonPath('data.messages_written.0.body', 'Mensaje escrito propio')
            ->assertJsonCount(1, 'data.trip_safety_events')
            ->assertJsonPath('data.trip_safety_events.0.type', 'trip_started')
            ->assertJsonMissingPath('data.trip_safety_events.0.travel_offer_id')
            ->assertJsonCount(1, 'data.safety_notification_deliveries')
            ->assertJsonPath('data.safety_notification_deliveries.0.channel', 'email')
            ->assertJsonPath('data.safety_notification_deliveries.0.status', 'sent')
            ->assertJsonMissingPath('data.safety_notification_deliveries.0.recipient_hash')
            ->assertJsonMissingPath('data.safety_notification_deliveries.0.provider_message_id')
            ->assertJsonCount(1, 'data.trip_check_ins')
            ->assertJsonPath('data.trip_check_ins.0.type', 'arrival')
            ->assertJsonCount(1, 'data.trip_locations')
            ->assertJsonPath('data.trip_locations.0.latitude', 3.451)
            ->assertJsonPath('data.trip_locations.0.longitude', -76.532)
            ->assertJsonMissingPath('data.trip_locations.0.travel_offer_id')
            ->assertJsonCount(1, 'data.reports_written')
            ->assertJsonPath('data.reports_written.0.category', 'safety')
            ->assertJsonMissingPath('data.reports_written.0.description')
            ->assertJsonMissingPath('data.reports_written.0.reported_profile_id')
            ->assertJsonCount(1, 'data.insurance_enrollments')
            ->assertJsonPath('data.insurance_enrollments.0.product_key', 'student-basic')
            ->assertJsonMissingPath('data.insurance_enrollments.0.policy_number')
            ->assertJsonMissingPath('data.insurance_enrollments.0.policy_document_path')
            ->assertJsonMissingPath('data.insurance_enrollments.0.review_note')
            ->assertJsonCount(1, 'data.membership_payments')
            ->assertJsonPath('data.membership_payments.0.reference', 'membership-own-reference')
            ->assertJsonPath('data.membership_payments.0.amount_in_cents', 250000)
            ->assertJsonMissingPath('data.membership_payments.0.gateway_transaction_id')
            ->assertJsonCount(1, 'data.safety_alerts')
            ->assertJsonPath('data.safety_alerts.0.message', 'Alerta propia')
            ->assertJsonPath('data.safety_alerts.0.latitude', 3.451)
            ->assertJsonPath('data.safety_alerts.0.longitude', -76.532)
            ->assertJsonPath('data.safety_alerts.0.location', 'Ubicación privada')
            ->assertJsonMissingPath('data.account.password')
            ->assertJsonMissingPath('data.account.remember_token')
            ->assertJsonMissingPath('data.student_profile.user_id')
            ->assertJsonMissing(['email' => $otherUser->email])
            ->assertJsonMissing(['body' => 'Mensaje ajeno'])
            ->assertJsonMissing(['message' => 'Alerta de otra persona'])
            ->assertJsonMissing(['description' => 'Reporte de otra persona'])
            ->assertJsonMissing(['provider' => 'Proveedor ajeno'])
            ->assertJsonMissing(['reference' => 'other-reference'])
            ->assertJsonMissing(['user_id' => $otherUser->id])
            ->assertJsonMissing(['latitude' => 4.111])
            ->assertJsonMissing(['longitude' => -75.1]);
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
        $this->postJson('/api/register', [
            'name' => 'Ana López',
            'email' => 'ana@uniajc.edu.co',
            'password' => 'Estudiante2026!',
            'password_confirmation' => 'Estudiante2026!',
            'university' => 'uniajc',
        ])->assertCreated();
        $user = User::firstOrFail();

        $login = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'Estudiante2026!',
        ])->assertOk()->assertJsonPath('user.id', $user->id);

        $sessionCookie = $login->getCookie(config('session.cookie'), false);
        $this->assertNotNull($sessionCookie);
        $this->withCookie(config('session.cookie'), $sessionCookie->getValue())
            ->getJson('/api/me')->assertOk()
            ->assertJsonPath('user.email', $user->email);
        $this->withCookie(config('session.cookie'), $sessionCookie->getValue())
            ->postJson('/api/logout')->assertOk();
        $this->assertSame(0, $user->tokens()->count());
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

    public function test_signed_verification_link_does_not_reactivate_a_blocked_account(): void
    {
        $user = User::factory()->unverified()->create([
            'email' => 'ana@uniajc.edu.co',
            'university' => 'UNIAJC',
            'status' => User::STATUS_BLOCKED,
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

        $this->get($url)->assertForbidden();

        $this->assertSame(User::STATUS_BLOCKED, $user->fresh()->status);
        $this->assertNull($user->fresh()->email_verified_at);
        $this->assertFalse($profile->fresh()->verified);
        $this->assertSame('pendiente-verificacion', $profile->fresh()->status);
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
            'status' => User::STATUS_ACTIVE,
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

    public function test_student_profile_alias_uses_the_same_profile_update_flow(): void
    {
        $user = User::factory()->create();
        $profile = StudentProfile::create([
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'university' => 'UNIAJC',
            'verified' => true,
            'status' => 'activo',
        ]);
        $token = $user->createToken('web')->plainTextToken;

        $this->withToken($token)->putJson("/api/students/{$profile->id}/profile", [
            'name' => 'Ana Pérez',
            'transport' => 'MIO',
            'privacy' => 'Privacidad máxima',
        ])->assertOk()
            ->assertJsonPath('data.name', 'Ana Pérez')
            ->assertJsonPath('data.transport', 'MIO')
            ->assertJsonPath('data.privacy', 'Privacidad máxima');

        $this->assertSame('Ana Pérez', $user->fresh()->name);
        $this->assertSame('MIO', $profile->fresh()->transport);
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

    public function test_user_can_change_password_with_a_browser_session(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('Estudiante2026!'),
        ]);
        $accessToken = $user->createToken('legacy-client');
        $login = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'Estudiante2026!',
        ])->assertOk();
        $sessionCookie = $login->getCookie(config('session.cookie'), false);
        $this->assertNotNull($sessionCookie);

        $passwordChange = $this->withCookie(config('session.cookie'), $sessionCookie->getValue())
            ->putJson('/api/auth/change-password', [
                'current_password' => 'Estudiante2026!',
                'password' => 'NuevaClave2026Segura',
                'password_confirmation' => 'NuevaClave2026Segura',
            ])->assertOk();

        $this->assertTrue(Hash::check('NuevaClave2026Segura', $user->fresh()->password));
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $accessToken->accessToken->id]);
        $rotatedSessionCookie = $passwordChange->getCookie(config('session.cookie'), false);
        $this->assertNotNull($rotatedSessionCookie);
        $this->withCookie(config('session.cookie'), $rotatedSessionCookie->getValue())
            ->putJson('/api/auth/profile', ['name' => 'Sesión conservada'])->assertOk();
    }

    public function test_stale_auth_version_cannot_authorize_a_browser_session(): void
    {
        $user = User::factory()->create([
            'auth_version' => 1,
        ]);
        $this->actingAs($user, 'web')->withSession(['auth_version' => 1])
            ->putJson('/api/auth/profile', ['name' => 'Sesión vigente'])->assertOk();

        $user->forceFill(['auth_version' => 2])->save();
        $this->putJson('/api/auth/profile', ['name' => 'Sesión obsoleta'])->assertUnauthorized();
    }

    public function test_blocking_an_account_invalidates_its_existing_browser_session(): void
    {
        $student = User::factory()->create([
            'email_verified_at' => now(),
        ]);
        StudentProfile::create([
            'user_id' => $student->id,
            'name' => $student->name,
            'email' => $student->email,
            'university' => 'UNIAJC',
            'verified' => true,
            'status' => 'activo',
        ]);
        $login = $this->postJson('/api/login', [
            'email' => $student->email,
            'password' => 'password',
        ])->assertOk();
        $session = $login->getCookie(config('session.cookie'), false);
        $admin = User::factory()->create([
            'role' => User::ROLE_ADMIN,
            'email_verified_at' => now(),
            'status' => User::STATUS_ACTIVE,
        ]);

        $this->actingAs($admin, 'sanctum')->patchJson("/api/admin/users/{$student->id}", [
            'status' => User::STATUS_BLOCKED,
        ])->assertOk();

        $this->assertDatabaseHas('users', [
            'id' => $student->id,
            'status' => User::STATUS_BLOCKED,
            'auth_version' => 2,
        ]);

        $this->app['auth']->forgetGuards();
        $this->flushHeaders()->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Referer' => 'http://localhost:5173/',
        ])->withCookie(config('session.cookie'), $session->getValue())
            ->postJson('/api/trips', [
                'origin' => 'Universidad',
                'destination' => 'Casa',
            ])->assertForbidden();

        $student->forceFill(['status' => User::STATUS_ACTIVE])->save();
        $this->app['auth']->forgetGuards();
        $this->flushHeaders()->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Referer' => 'http://localhost:5173/',
        ])->withCookie(config('session.cookie'), $session->getValue())
            ->postJson('/api/trips', [
                'origin' => 'Universidad',
                'destination' => 'Casa',
            ])->assertUnauthorized();
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

    public function test_profile_photo_is_removed_when_profile_transaction_fails(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $token = $user->createToken('web')->plainTextToken;
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l0sAAAAASUVORK5CYII=');
        DB::unprepared(
            'CREATE TRIGGER fail_profile_update BEFORE UPDATE ON users '
            ."BEGIN SELECT RAISE(ABORT, 'forced update failure'); END;",
        );

        $this->withToken($token)->post('/api/profile/photo', [
            'photo' => UploadedFile::fake()->createWithContent('avatar.png', $png),
        ], ['Accept' => 'application/json'])->assertServerError();

        $this->assertSame([], Storage::disk('public')->allFiles('profile-photos'));
        $this->assertNull($user->fresh()->profile_photo_path);
    }

    public function test_student_profile_user_id_has_a_database_unique_index(): void
    {
        $this->assertContains(
            'student_profiles_user_id_unique',
            Schema::getIndexListing('student_profiles'),
        );
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
