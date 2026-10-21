<?php

namespace Tests\Feature;

use App\Jobs\SendSafetyNotification;
use App\Models\StudentProfile;
use App\Models\TravelOffer;
use App\Models\TripCheckIn;
use App\Models\TripRequest;
use App\Models\TripSafetyEvent;
use App\Models\User;
use App\Notifications\SafetyEventNotification;
use App\Services\SafetyNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class SafetyNotificationsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'mail.default' => 'smtp',
            'services.twilio.account_sid' => 'ACtest',
            'services.twilio.auth_token' => 'test-token',
            'services.twilio.from' => '+15555550100',
            'services.twilio.whatsapp_from' => 'whatsapp:+15555550100',
        ]);
    }

    public function test_trusted_contact_consent_requires_both_destinations_and_can_be_withdrawn(): void
    {
        $user = $this->createStudent();

        $this->actingAs($user, 'sanctum')->putJson('/api/auth/profile', [
            'name' => 'Changed before invalid consent',
            'trusted_contact_consent' => true,
            'trusted_contact_email' => 'trusted@example.test',
        ])->assertUnprocessable();

        $this->assertSame($user->name, $user->fresh()->name);
        $this->assertFalse($user->fresh()->trusted_contact_consent);

        $this->actingAs($user, 'sanctum')->putJson('/api/auth/profile', [
            'trusted_contact_consent' => true,
            'trusted_contact_email' => 'trusted@example.test',
            'trusted_contact_phone' => '+573001234567',
        ])->assertOk()
            ->assertJsonPath('user.trusted_contact_consent', true)
            ->assertJsonPath('user.trusted_contact_email', 'trusted@example.test')
            ->assertJsonPath('user.trusted_contact_phone', '+573001234567');
        $this->assertNotNull($user->fresh()->trusted_contact_consent_at);

        $this->actingAs($user, 'sanctum')->putJson('/api/auth/profile', [
            'trusted_contact_consent' => false,
            'trusted_contact_email' => null,
            'trusted_contact_phone' => null,
        ])->assertOk()
            ->assertJsonPath('user.trusted_contact_consent', false)
            ->assertJsonPath('user.trusted_contact_email', null)
            ->assertJsonPath('user.trusted_contact_phone', null);
        $this->assertNull($user->fresh()->trusted_contact_consent_at);
    }

    public function test_sos_queues_email_sms_and_whatsapp_without_exposing_destinations(): void
    {
        Queue::fake();
        $user = $this->createStudent([
            'trusted_contact_consent' => true,
            'trusted_contact_consent_at' => now(),
            'trusted_contact_email' => 'trusted@example.test',
            'trusted_contact_phone' => '+573001234567',
        ]);
        $this->createProfile($user);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/alerts', [
            'latitude' => 3.45,
            'longitude' => -76.53,
            'accuracy_meters' => 20,
        ]);

        $response->assertCreated()
            ->assertJsonCount(3, 'data.notification_deliveries')
            ->assertJsonMissing(['trusted_contact_email' => 'trusted@example.test'])
            ->assertJsonMissing(['trusted_contact_phone' => '+573001234567']);
        $this->assertDatabaseCount('safety_notification_deliveries', 3);
        Queue::assertPushed(SendSafetyNotification::class, 3);
    }

    public function test_sos_does_not_send_external_notifications_without_contact_consent(): void
    {
        Queue::fake();
        $user = $this->createStudent([
            'trusted_contact_email' => 'trusted@example.test',
            'trusted_contact_phone' => '+573001234567',
        ]);
        $this->createProfile($user);

        $this->actingAs($user, 'sanctum')->postJson('/api/alerts')->assertCreated()
            ->assertJsonCount(0, 'data.notification_deliveries');

        $this->assertDatabaseCount('safety_alerts', 1);
        $this->assertDatabaseCount('safety_notification_deliveries', 0);
        Queue::assertNothingPushed();
    }

    public function test_missing_delivery_destination_is_recorded_as_skipped(): void
    {
        Queue::fake();
        $user = $this->createStudent([
            'trusted_contact_consent' => true,
            'trusted_contact_consent_at' => now(),
            'trusted_contact_email' => 'trusted@example.test',
        ]);

        app(SafetyNotificationService::class)->trigger([
            'user_id' => $user->id,
            'type' => 'panic',
        ]);

        $this->assertDatabaseHas('safety_notification_deliveries', [
            'channel' => 'sms',
            'status' => 'skipped',
            'failure_reason' => 'El contacto no tiene un teléfono configurado.',
        ]);
        $this->assertDatabaseHas('safety_notification_deliveries', [
            'channel' => 'whatsapp',
            'status' => 'skipped',
            'failure_reason' => 'El contacto no tiene un teléfono configurado.',
        ]);
        Queue::assertPushed(SendSafetyNotification::class, 1);
    }

    public function test_twilio_delivery_updates_status_and_uses_e164_destination(): void
    {
        $user = $this->createStudent([
            'trusted_contact_consent' => true,
            'trusted_contact_consent_at' => now(),
            'trusted_contact_phone' => '+573001234567',
        ]);
        $event = TripSafetyEvent::create([
            'user_id' => $user->id,
            'type' => 'panic',
            'occurred_at' => now(),
        ]);
        $delivery = $event->deliveries()->create([
            'channel' => 'sms',
            'status' => 'pending',
            'recipient_hash' => hash('sha256', '+573001234567'),
        ]);
        Http::fake([
            'api.twilio.com/*' => Http::response(['sid' => 'SM-test-message'], 201),
        ]);

        (new SendSafetyNotification($delivery->id))->handle();

        $this->assertDatabaseHas('safety_notification_deliveries', [
            'id' => $delivery->id,
            'status' => 'sent',
            'provider_message_id' => 'SM-test-message',
        ]);
        Http::assertSent(fn ($request): bool => $request['To'] === '+573001234567'
            && $request['From'] === '+15555550100'
            && str_contains($request['Body'], 'activó una alerta SOS'));
    }

    public function test_trip_location_generates_one_route_deviation_and_one_arrival_event(): void
    {
        Queue::fake();
        $owner = $this->createStudent();
        $this->createProfile($owner);
        $passenger = $this->createStudent();
        $passengerProfile = $this->createProfile($passenger);
        $trip = TravelOffer::create([
            'student_profile_id' => $owner->studentProfile->id,
            'origin' => 'Origen Cali',
            'destination' => 'Destino Cali',
            'mode' => 'Carro',
            'departure_time' => '09:00',
            'seats' => 1,
            'cost' => '0',
            'status' => 'en-curso',
            'safety_route' => [[3.45, -76.53], [3.46, -76.52], [3.47, -76.51]],
            'safety_route_duration_minutes' => 40,
        ]);
        TripRequest::create([
            'travel_offer_id' => $trip->id,
            'requester_profile_id' => $passengerProfile->id,
            'status' => 'accepted',
        ]);

        $this->actingAs($owner, 'sanctum')->postJson("/api/trips/{$trip->id}/location", [
            'latitude' => 3.50,
            'longitude' => -76.50,
            'accuracy_meters' => 20,
        ])->assertOk()->assertJsonPath('data.safety_events.0.type', 'route_deviation');
        $this->actingAs($owner, 'sanctum')->postJson("/api/trips/{$trip->id}/location", [
            'latitude' => 3.47,
            'longitude' => -76.51,
            'accuracy_meters' => 20,
        ])->assertOk()->assertJsonPath('data.safety_events.0.type', 'arrival_geofence');
        $this->actingAs($owner, 'sanctum')->postJson("/api/trips/{$trip->id}/location", [
            'latitude' => 3.50,
            'longitude' => -76.50,
            'accuracy_meters' => 20,
        ])->assertOk()->assertJsonPath('data.safety_events.0.type', 'route_deviation');

        $this->assertDatabaseCount('trip_safety_events', 2);
        $this->assertDatabaseHas('trip_safety_events', ['travel_offer_id' => $trip->id, 'type' => 'route_deviation']);
        $this->assertDatabaseHas('trip_safety_events', ['travel_offer_id' => $trip->id, 'type' => 'arrival_geofence']);
        Queue::assertNothingPushed();
    }

    public function test_geofenced_trip_requires_a_duration_and_sets_its_arrival_deadline_on_start(): void
    {
        $owner = $this->createStudent();
        $ownerProfile = $this->createProfile($owner);
        $passenger = $this->createStudent();
        $passengerProfile = $this->createProfile($passenger);
        $payload = [
            'origin' => 'Universidad',
            'destination' => 'Destino',
            'mode' => 'Carro',
            'departure_time' => '09:00',
            'seats' => 1,
            'safety_route' => [[3.45, -76.53], [3.47, -76.51]],
        ];

        $this->actingAs($owner, 'sanctum')->postJson('/api/trips', $payload)->assertUnprocessable();
        $this->assertDatabaseCount('travel_offers', 0);

        $response = $this->actingAs($owner, 'sanctum')->postJson('/api/trips', [
            ...$payload,
            'safety_route_duration_minutes' => 40,
        ]);
        $response->assertCreated()
            ->assertJsonPath('data.safety_geofence_enabled', true)
            ->assertJsonMissingPath('data.safety_route');
        $tripId = $response->json('data.id');
        $this->assertDatabaseHas('travel_offers', [
            'id' => $tripId,
            'safety_route_duration_minutes' => 40,
        ]);

        TripRequest::create([
            'travel_offer_id' => $tripId,
            'requester_profile_id' => $passengerProfile->id,
            'status' => 'accepted',
        ]);
        $startedAt = now();
        $this->actingAs($owner, 'sanctum')->patchJson("/api/trips/{$tripId}", [
            'status' => 'en-curso',
        ])->assertOk();

        $trip = TravelOffer::findOrFail($tripId);
        $this->assertNotNull($trip->safety_geofence_consent_at);
        $this->assertNotNull($trip->started_at);
        $this->assertEquals(55, $trip->started_at->diffInMinutes($trip->arrival_checkin_deadline_at));
        $this->assertGreaterThanOrEqual(0, $trip->started_at->diffInSeconds($startedAt));
        $this->assertSame($ownerProfile->id, $trip->student_profile_id);
    }

    public function test_overdue_arrival_command_notifies_only_participants_without_arrival_checkin(): void
    {
        Queue::fake();
        $owner = $this->createStudent([
            'trusted_contact_consent' => true,
            'trusted_contact_consent_at' => now(),
            'trusted_contact_email' => 'owner-contact@example.test',
            'trusted_contact_phone' => '+573001234567',
        ]);
        $ownerProfile = $this->createProfile($owner);
        $passenger = $this->createStudent([
            'trusted_contact_consent' => true,
            'trusted_contact_consent_at' => now(),
            'trusted_contact_email' => 'passenger-contact@example.test',
            'trusted_contact_phone' => '+573009876543',
        ]);
        $passengerProfile = $this->createProfile($passenger);
        $trip = TravelOffer::create([
            'student_profile_id' => $ownerProfile->id,
            'origin' => 'Origen Cali',
            'destination' => 'Destino Cali',
            'mode' => 'Carro',
            'departure_time' => '09:00',
            'seats' => 1,
            'cost' => '0',
            'status' => 'en-curso',
            'started_at' => now()->subHours(2),
            'arrival_checkin_deadline_at' => now()->subMinute(),
        ]);
        TripRequest::create([
            'travel_offer_id' => $trip->id,
            'requester_profile_id' => $passengerProfile->id,
            'status' => 'accepted',
        ]);
        TripCheckIn::create([
            'travel_offer_id' => $trip->id,
            'user_id' => $passenger->id,
            'type' => 'arrival',
            'checked_in_at' => now()->subMinutes(2),
        ]);

        $this->artisan('viajau:alert-overdue-arrivals')->assertSuccessful();

        $this->assertDatabaseCount('trip_safety_events', 1);
        $this->assertDatabaseHas('trip_safety_events', [
            'travel_offer_id' => $trip->id,
            'user_id' => $owner->id,
            'type' => 'arrival_checkin_overdue',
        ]);
        $this->assertDatabaseCount('safety_notification_deliveries', 3);
        Queue::assertPushed(SendSafetyNotification::class, 3);
    }

    public function test_email_delivery_uses_laravel_notification_mail_channel(): void
    {
        Notification::fake();
        $user = $this->createStudent([
            'trusted_contact_consent' => true,
            'trusted_contact_consent_at' => now(),
            'trusted_contact_email' => 'trusted@example.test',
        ]);
        $event = TripSafetyEvent::create([
            'user_id' => $user->id,
            'type' => 'panic',
            'occurred_at' => now(),
        ]);
        $delivery = $event->deliveries()->create([
            'channel' => 'email',
            'status' => 'pending',
            'recipient_hash' => hash('sha256', 'trusted@example.test'),
        ]);

        (new SendSafetyNotification($delivery->id))->handle();

        Notification::assertSentOnDemand(
            SafetyEventNotification::class,
            fn ($notification, array $channels, object $notifiable): bool => in_array('mail', $channels, true)
                && $notifiable->routes['mail'] === 'trusted@example.test',
        );
        $this->assertDatabaseHas('safety_notification_deliveries', [
            'id' => $delivery->id,
            'status' => 'sent',
        ]);
    }

    private function createStudent(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'email_verified_at' => now(),
            'status' => User::STATUS_ACTIVE,
        ], $attributes));
    }

    private function createProfile(User $user): StudentProfile
    {
        return StudentProfile::create([
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'university' => 'UNIAJC',
            'career' => 'Ingeniería',
            'verified' => true,
            'status' => 'activo',
        ]);
    }
}
