<?php

namespace Tests\Feature;

use App\Models\StudentProfile;
use App\Models\TravelOffer;
use App\Models\TripRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TripManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_verified_student_can_publish_offer_without_supplying_profile_or_status(): void
    {
        $owner = User::factory()->create();
        $profile = $this->createProfile($owner);
        $token = $owner->createToken('web')->plainTextToken;

        $this->withToken($token)->postJson('/api/trips', [
            'origin' => 'El Caney',
            'destination' => 'UNIAJC',
            'departure_date' => today()->addDay()->toDateString(),
            'departure_time' => '19:45',
            'seats' => 2,
            'status' => 'cancelada',
        ])->assertCreated()
            ->assertJsonPath('data.student_profile_id', $profile->id)
            ->assertJsonPath('data.departure_date', today()->addDay()->toDateString())
            ->assertJsonPath('data.status', 'oferta-activa');
    }

    public function test_trip_creation_is_rate_limited_per_authenticated_client(): void
    {
        $owner = User::factory()->create();
        $profile = $this->createProfile($owner);
        $token = $owner->createToken('web')->plainTextToken;
        $payload = [
            'origin' => 'El Caney',
            'destination' => 'UNIAJC',
            'departure_date' => today()->addDay()->toDateString(),
            'departure_time' => '19:45',
            'seats' => 2,
        ];

        for ($attempt = 0; $attempt < 10; $attempt++) {
            $this->withToken($token)->postJson('/api/trips', $payload)->assertCreated();
        }
        $this->withToken($token)->postJson('/api/trips', $payload)->assertTooManyRequests();

        $this->assertDatabaseCount('travel_offers', 10);
        $this->assertDatabaseHas('travel_offers', ['student_profile_id' => $profile->id]);
    }

    public function test_student_can_request_a_seat_and_only_offer_owner_can_accept_it(): void
    {
        $owner = User::factory()->create();
        $ownerProfile = $this->createProfile($owner);
        $offer = $this->createOffer($ownerProfile, ['seats' => 1]);
        $requester = User::factory()->create();
        $requesterProfile = $this->createProfile($requester);

        $response = $this->actingAs($requester, 'sanctum')->postJson("/api/trips/{$offer->id}/requests")
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending');
        $tripRequestId = $response->json('data.id');

        $this->actingAs($requester, 'sanctum')->patchJson("/api/trip-requests/{$tripRequestId}", [
            'status' => 'accepted',
        ])->assertForbidden();
        $this->assertDatabaseHas('travel_offers', ['id' => $offer->id, 'seats' => 1]);

        $ownerResponse = $this->flushHeaders()->actingAs($owner, 'sanctum')->patchJson("/api/trip-requests/{$tripRequestId}", [
            'status' => 'accepted',
        ]);
        $this->assertSame(200, $ownerResponse->status(), $ownerResponse->getContent());
        $ownerResponse->assertJsonPath('data.status', 'accepted');

        $this->assertDatabaseHas('travel_offers', ['id' => $offer->id, 'seats' => 0]);
        $this->assertDatabaseHas('trip_requests', [
            'id' => $tripRequestId,
            'requester_profile_id' => $requesterProfile->id,
            'status' => 'accepted',
        ]);
    }

    public function test_expired_offer_cannot_receive_or_accept_seat_requests(): void
    {
        $owner = User::factory()->create();
        $offer = $this->createOffer($this->createProfile($owner), [
            'departure_date' => today()->subDay()->toDateString(),
            'seats' => 1,
        ]);
        $requester = User::factory()->create();
        $profile = $this->createProfile($requester);
        $token = $requester->createToken('web')->plainTextToken;

        $this->withToken($token)->postJson("/api/trips/{$offer->id}/requests")
            ->assertConflict();

        $tripRequest = TripRequest::create([
            'travel_offer_id' => $offer->id,
            'requester_profile_id' => $profile->id,
            'status' => 'pending',
        ]);

        $this->flushHeaders()->actingAs($owner, 'sanctum')
            ->patchJson("/api/trip-requests/{$tripRequest->id}", ['status' => 'accepted'])
            ->assertConflict();

        $this->assertDatabaseHas('trip_requests', ['id' => $tripRequest->id, 'status' => 'pending']);
        $this->assertDatabaseHas('travel_offers', ['id' => $offer->id, 'seats' => 1]);
    }

    public function test_offer_owner_cannot_request_a_seat_on_their_own_offer(): void
    {
        $owner = User::factory()->create();
        $profile = $this->createProfile($owner);
        $offer = $this->createOffer($profile);
        $token = $owner->createToken('web')->plainTextToken;

        $this->withToken($token)->postJson("/api/trips/{$offer->id}/requests")
            ->assertUnprocessable();
    }

    public function test_duplicate_request_is_rejected_without_creating_another_row(): void
    {
        $owner = User::factory()->create();
        $offer = $this->createOffer($this->createProfile($owner));
        $requester = User::factory()->create();
        $this->createProfile($requester);
        $token = $requester->createToken('web')->plainTextToken;

        $this->withToken($token)->postJson("/api/trips/{$offer->id}/requests")->assertCreated();
        $this->withToken($token)->postJson("/api/trips/{$offer->id}/requests")->assertConflict();

        $this->assertDatabaseCount('trip_requests', 1);
    }

    public function test_requester_can_withdraw_and_owner_can_reject_pending_requests(): void
    {
        $owner = User::factory()->create();
        $offer = $this->createOffer($this->createProfile($owner));
        $requester = User::factory()->create();
        $this->createProfile($requester);
        $requestId = $this->actingAs($requester, 'sanctum')
            ->postJson("/api/trips/{$offer->id}/requests")
            ->assertCreated()
            ->json('data.id');
        $this->actingAs($requester, 'sanctum')->patchJson("/api/trip-requests/{$requestId}", [
            'status' => 'cancelled',
        ])->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $nextRequester = User::factory()->create();
        $this->createProfile($nextRequester);
        $nextRequestId = $this->flushHeaders()->actingAs($nextRequester, 'sanctum')
            ->postJson("/api/trips/{$offer->id}/requests")
            ->assertCreated()
            ->json('data.id');
        $this->flushHeaders()->actingAs($owner, 'sanctum')
            ->patchJson("/api/trip-requests/{$nextRequestId}", ['status' => 'rejected'])
            ->assertOk()
            ->assertJsonPath('data.status', 'rejected');
    }

    public function test_accepted_passenger_can_cancel_before_start_and_release_the_reserved_seat(): void
    {
        $owner = User::factory()->create();
        $offer = $this->createOffer($this->createProfile($owner), ['seats' => 0]);
        $requester = User::factory()->create();
        $profile = $this->createProfile($requester);
        $tripRequest = TripRequest::create([
            'travel_offer_id' => $offer->id,
            'requester_profile_id' => $profile->id,
            'status' => 'accepted',
        ]);

        $this->actingAs($requester, 'sanctum')
            ->patchJson("/api/trip-requests/{$tripRequest->id}", ['status' => 'cancelled'])
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $this->assertDatabaseHas('travel_offers', ['id' => $offer->id, 'seats' => 1]);
    }

    public function test_offer_cannot_be_overbooked_and_only_owner_can_cancel_it(): void
    {
        $owner = User::factory()->create();
        $offer = $this->createOffer($this->createProfile($owner), ['seats' => 1]);
        $requesters = collect([User::factory()->create(), User::factory()->create()]);
        $requests = $requesters->map(function (User $requester) use ($offer): TripRequest {
            $this->createProfile($requester);
            $token = $requester->createToken('web')->plainTextToken;

            return TripRequest::create([
                'travel_offer_id' => $offer->id,
                'requester_profile_id' => $requester->studentProfile->id,
                'status' => 'pending',
            ]);
        });

        $this->flushHeaders()->actingAs($owner, 'sanctum')->patchJson('/api/trip-requests/'.$requests[0]->id, [
            'status' => 'accepted',
        ])->assertOk();
        $this->flushHeaders()->actingAs($owner, 'sanctum')->patchJson('/api/trip-requests/'.$requests[1]->id, [
            'status' => 'accepted',
        ])->assertConflict();

        $this->flushHeaders()->actingAs($requesters[0], 'sanctum')->patchJson("/api/trips/{$offer->id}", [
            'status' => 'cancelada',
        ])
            ->assertForbidden();

        $this->flushHeaders()->actingAs($owner, 'sanctum')->patchJson("/api/trips/{$offer->id}", [
            'status' => 'cancelada',
        ])
            ->assertOk();

        $this->assertDatabaseHas('travel_offers', ['id' => $offer->id, 'status' => 'cancelada']);
        $this->assertDatabaseHas('trip_requests', ['id' => $requests[1]->id, 'status' => 'cancelled']);
    }

    public function test_owner_can_start_and_complete_a_trip_only_after_accepting_a_passenger(): void
    {
        $owner = User::factory()->create();
        $offer = $this->createOffer($this->createProfile($owner));
        $ownerToken = $owner->createToken('web')->plainTextToken;

        $this->withToken($ownerToken)->patchJson("/api/trips/{$offer->id}", [
            'status' => 'en-curso',
        ])->assertConflict();

        $passenger = User::factory()->create();
        $passengerProfile = $this->createProfile($passenger);
        $tripRequest = TripRequest::create([
            'travel_offer_id' => $offer->id,
            'requester_profile_id' => $passengerProfile->id,
            'status' => 'accepted',
        ]);

        $this->withToken($ownerToken)->patchJson("/api/trips/{$offer->id}", [
            'status' => 'en-curso',
        ])->assertOk();
        $this->flushHeaders()->actingAs($passenger, 'sanctum')
            ->patchJson("/api/trip-requests/{$tripRequest->id}", ['status' => 'cancelled'])
            ->assertConflict();
        $this->flushHeaders()->actingAs($owner, 'sanctum')->patchJson("/api/trips/{$offer->id}", [
            'status' => 'completada',
        ])->assertOk();
        $this->withToken($ownerToken)->patchJson("/api/trips/{$offer->id}", [
            'status' => 'oferta-activa',
        ])->assertUnprocessable();

        $this->assertDatabaseHas('trip_requests', ['id' => $tripRequest->id, 'status' => 'accepted']);
        $this->assertDatabaseHas('travel_offers', ['id' => $offer->id, 'status' => 'completada']);
    }

    public function test_my_trips_only_returns_own_offers_and_requests_without_private_data(): void
    {
        $owner = User::factory()->create();
        $ownerProfile = $this->createProfile($owner);
        $offer = $this->createOffer($ownerProfile);
        $requester = User::factory()->create();
        $requesterProfile = $this->createProfile($requester, ['email' => 'requester@example.test']);
        $tripRequest = TripRequest::create([
            'travel_offer_id' => $offer->id,
            'requester_profile_id' => $requesterProfile->id,
            'status' => 'pending',
        ]);
        $token = $owner->createToken('web')->plainTextToken;

        $this->withToken($token)->getJson('/api/trips/mine')->assertOk()
            ->assertJsonPath('data.offers.0.id', $offer->id)
            ->assertJsonPath('data.offers.0.requests.0.id', $tripRequest->id)
            ->assertJsonPath('data.offers.0.requests.0.requester.name', $requesterProfile->name)
            ->assertJsonMissingPath('data.offers.0.requests.0.requester.email')
            ->assertJsonCount(0, 'data.requests');
    }

    private function createProfile(User $user, array $attributes = []): StudentProfile
    {
        return StudentProfile::create(array_merge([
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'university' => 'UNIAJC',
            'career' => 'Ingeniería',
            'verified' => true,
            'status' => 'activo',
        ], $attributes));
    }

    private function createOffer(StudentProfile $profile, array $attributes = []): TravelOffer
    {
        return TravelOffer::create(array_merge([
            'student_profile_id' => $profile->id,
            'origin' => 'UNIAJC',
            'destination' => 'El Caney',
            'mode' => 'MIO + caminata',
            'departure_date' => today()->addDay()->toDateString(),
            'departure_time' => '19:45',
            'seats' => 2,
            'cost' => '2500 COP',
            'status' => 'oferta-activa',
        ], $attributes));
    }
}
