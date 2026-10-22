<?php

namespace Tests\Feature;

use App\Models\StudentProfile;
use App\Models\TravelOffer;
use App\Models\TripMessage;
use App\Models\TripRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TripCommunicationTest extends TestCase
{
    use RefreshDatabase;

    public function test_trip_owner_and_accepted_passenger_can_exchange_persistent_messages(): void
    {
        [$owner, $ownerProfile] = $this->createStudent('Conductor');
        [$passenger, $passengerProfile] = $this->createStudent('Pasajera');
        $trip = $this->createTrip($ownerProfile);
        TripRequest::create([
            'travel_offer_id' => $trip->id,
            'requester_profile_id' => $passengerProfile->id,
            'status' => 'accepted',
        ]);

        $ownerResponse = $this->actingAs($owner, 'sanctum')->postJson("/api/trips/{$trip->id}/messages", [
            'body' => 'Nos vemos en la entrada principal.',
        ])->assertCreated()
            ->assertJsonPath('data.sender_name', 'Conductor')
            ->assertJsonPath('data.is_mine', true);
        $this->assertDatabaseHas('trip_messages', [
            'travel_offer_id' => $trip->id,
            'sender_profile_id' => $ownerProfile->id,
            'body' => 'Nos vemos en la entrada principal.',
        ]);

        $this->flushHeaders()->actingAs($passenger, 'sanctum')->getJson("/api/trips/{$trip->id}/messages")
            ->assertOk()
            ->assertJsonPath('data.0.body', 'Nos vemos en la entrada principal.')
            ->assertJsonPath('data.0.sender_name', 'Conductor')
            ->assertJsonPath('data.0.is_mine', false)
            ->assertJsonPath('meta.read_only', false);

        $this->flushHeaders()->actingAs($passenger, 'sanctum')->postJson("/api/trips/{$trip->id}/messages", [
            'body' => 'Confirmado, allí estaré.',
        ])->assertCreated();
        $this->flushHeaders()->actingAs($owner, 'sanctum')->getJson('/api/communication/trips')
            ->assertOk()
            ->assertJsonPath('data.0.id', $trip->id)
            ->assertJsonPath('data.0.message_count', 2)
            ->assertJsonPath('data.0.participants.1.name', 'Pasajera');
    }

    public function test_pending_or_unrelated_users_cannot_read_or_send_trip_messages(): void
    {
        [, $ownerProfile] = $this->createStudent();
        [$pendingPassenger, $pendingProfile] = $this->createStudent();
        [$outsider] = $this->createStudent();
        $trip = $this->createTrip($ownerProfile);
        TripRequest::create([
            'travel_offer_id' => $trip->id,
            'requester_profile_id' => $pendingProfile->id,
            'status' => 'pending',
        ]);

        $this->actingAs($pendingPassenger, 'sanctum')->getJson("/api/trips/{$trip->id}/messages")->assertNotFound();
        $this->flushHeaders()->actingAs($pendingPassenger, 'sanctum')->postJson("/api/trips/{$trip->id}/messages", [
            'body' => 'No soy pasajera aceptada.',
        ])->assertNotFound();
        $this->flushHeaders()->actingAs($outsider, 'sanctum')->getJson('/api/communication/trips')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_closed_trip_chat_is_read_only_and_message_text_is_validated(): void
    {
        [$owner, $ownerProfile] = $this->createStudent();
        $trip = $this->createTrip($ownerProfile, ['status' => 'completada']);
        TripMessage::create([
            'travel_offer_id' => $trip->id,
            'sender_profile_id' => $ownerProfile->id,
            'body' => 'Historial conservado.',
        ]);

        $this->actingAs($owner, 'sanctum')->getJson("/api/trips/{$trip->id}/messages")
            ->assertOk()
            ->assertJsonPath('data.0.body', 'Historial conservado.')
            ->assertJsonPath('meta.read_only', true);
        $this->flushHeaders()->actingAs($owner, 'sanctum')->postJson("/api/trips/{$trip->id}/messages", [
            'body' => 'No debe enviarse.',
        ])->assertConflict();

        $openTrip = $this->createTrip($ownerProfile);
        $this->flushHeaders()->actingAs($owner, 'sanctum')->postJson("/api/trips/{$openTrip->id}/messages", [
            'body' => '   ',
        ])->assertUnprocessable();
        $this->flushHeaders()->actingAs($owner, 'sanctum')->postJson("/api/trips/{$openTrip->id}/messages", [
            'body' => str_repeat('a', 2001),
        ])->assertUnprocessable();
    }

    private function createStudent(string $name = 'Estudiante'): array
    {
        $user = User::factory()->create([
            'name' => $name,
            'role' => User::ROLE_STUDENT,
            'status' => User::STATUS_ACTIVE,
            'email_verified_at' => now(),
        ]);
        $profile = StudentProfile::create([
            'user_id' => $user->id,
            'name' => $name,
            'email' => $user->email,
            'university' => 'UNIAJC',
            'verified' => true,
            'status' => 'activo',
        ]);

        return [$user, $profile];
    }

    private function createTrip(StudentProfile $owner, array $overrides = []): TravelOffer
    {
        return TravelOffer::create([
            'student_profile_id' => $owner->id,
            'origin' => 'Sede Sur',
            'destination' => 'El Caney',
            'mode' => 'MIO',
            'departure_date' => today()->addDay()->toDateString(),
            'departure_time' => '18:00',
            'seats' => 1,
            'cost' => '2500 COP',
            'status' => 'oferta-activa',
            ...$overrides,
        ]);
    }
}
