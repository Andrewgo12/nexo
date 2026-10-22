<?php

namespace Tests\Feature;

use App\Models\StudentProfile;
use App\Models\TravelOffer;
use App\Models\TripLocation;
use App\Models\TripRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class TripSafetyTrackingTest extends TestCase
{
    use RefreshDatabase;

    public function test_accepted_participants_can_share_and_view_current_trip_locations(): void
    {
        [$owner, $passenger, $offer] = $this->createActiveTrip();
        $this->assertSame(User::STATUS_ACTIVE, $passenger->fresh()->status);
        $this->assertTrue($passenger->studentProfile->verified);
        $this->assertSame('activo', $passenger->studentProfile->status);

        $shareResponse = $this->actingAs($passenger, 'sanctum')->postJson("/api/trips/{$offer->id}/location", [
            'latitude' => 3.4516,
            'longitude' => -76.532,
            'accuracy_meters' => 18,
        ]);
        if ($shareResponse->status() !== 200) {
            self::fail($shareResponse->getContent());
        }
        $shareResponse->assertStatus(200, $shareResponse->getContent());

        $this->assertDatabaseHas('trip_locations', [
            'travel_offer_id' => $offer->id,
            'user_id' => $passenger->id,
            'latitude' => 3.4516,
            'longitude' => -76.532,
            'accuracy_meters' => 18,
        ]);

        $this->actingAs($owner, 'sanctum')->getJson("/api/trips/{$offer->id}/safety")
            ->assertOk()
            ->assertJsonPath('data.locations.0.user_id', $passenger->id)
            ->assertJsonPath('data.locations.0.latitude', 3.4516)
            ->assertJsonMissingPath('data.locations.0.email')
            ->assertJsonMissingPath('data.locations.0.emergency_contact');
    }

    public function test_location_updates_replace_the_current_position_instead_of_retaining_a_trail(): void
    {
        [, $passenger, $offer] = $this->createActiveTrip();

        $this->actingAs($passenger, 'sanctum')->postJson("/api/trips/{$offer->id}/location", [
            'latitude' => 3.45,
            'longitude' => -76.53,
        ])->assertOk();
        $this->actingAs($passenger, 'sanctum')->postJson("/api/trips/{$offer->id}/location", [
            'latitude' => 3.46,
            'longitude' => -76.52,
        ])->assertOk();

        $this->assertDatabaseCount('trip_locations', 1);
        $this->assertDatabaseHas('trip_locations', [
            'travel_offer_id' => $offer->id,
            'user_id' => $passenger->id,
            'latitude' => 3.46,
            'longitude' => -76.52,
        ]);
    }

    public function test_participant_can_stop_location_sharing_without_removing_other_participants_locations(): void
    {
        [$owner, $passenger, $offer] = $this->createActiveTrip();
        $this->actingAs($owner, 'sanctum')->postJson("/api/trips/{$offer->id}/location", [
            'latitude' => 3.45,
            'longitude' => -76.53,
        ])->assertOk();
        $this->actingAs($passenger, 'sanctum')->postJson("/api/trips/{$offer->id}/location", [
            'latitude' => 3.46,
            'longitude' => -76.52,
        ])->assertOk();

        $this->actingAs($passenger, 'sanctum')->deleteJson("/api/trips/{$offer->id}/location")
            ->assertOk()
            ->assertJsonPath('data.location_removed', true);

        $this->assertDatabaseCount('trip_locations', 1);
        $this->assertDatabaseHas('trip_locations', [
            'travel_offer_id' => $offer->id,
            'user_id' => $owner->id,
        ]);
    }

    public function test_only_owner_and_accepted_passengers_can_view_or_share_locations(): void
    {
        [$owner, , $offer] = $this->createActiveTrip();
        $stranger = User::factory()->create();
        $this->createProfile($stranger);

        $this->actingAs($stranger, 'sanctum')->getJson("/api/trips/{$offer->id}/safety")->assertForbidden();
        $this->actingAs($stranger, 'sanctum')->postJson("/api/trips/{$offer->id}/location", [
            'latitude' => 3.45,
            'longitude' => -76.53,
        ])->assertForbidden();
        $this->actingAs($stranger, 'sanctum')->deleteJson("/api/trips/{$offer->id}/location")
            ->assertForbidden();

        $this->actingAs($owner, 'sanctum')->postJson("/api/trips/{$offer->id}/location", [
            'latitude' => 3.45,
            'longitude' => -76.53,
        ])->assertOk();
    }

    public function test_blocked_accounts_cannot_access_active_trip_safety_endpoints(): void
    {
        [, $passenger, $offer] = $this->createActiveTrip();
        $passenger->update(['status' => User::STATUS_BLOCKED]);

        $this->actingAs($passenger, 'sanctum')->getJson("/api/trips/{$offer->id}/safety")
            ->assertForbidden();
        $this->actingAs($passenger, 'sanctum')->postJson("/api/trips/{$offer->id}/location", [
            'latitude' => 3.45,
            'longitude' => -76.53,
        ])->assertForbidden();
    }

    public function test_trip_members_can_check_in_once_at_departure_and_arrival(): void
    {
        [$owner, $passenger, $offer] = $this->createActiveTrip();

        $this->actingAs($passenger, 'sanctum')->postJson("/api/trips/{$offer->id}/check-ins", [
            'type' => 'departure',
        ])->assertCreated()
            ->assertJsonPath('data.type', 'departure');

        $this->actingAs($passenger, 'sanctum')->postJson("/api/trips/{$offer->id}/check-ins", [
            'type' => 'departure',
        ])->assertConflict();

        $this->actingAs($owner, 'sanctum')->postJson("/api/trips/{$offer->id}/check-ins", [
            'type' => 'arrival',
        ])->assertCreated();

        $this->actingAs($owner, 'sanctum')->getJson("/api/trips/{$offer->id}/safety")
            ->assertOk()
            ->assertJsonCount(2, 'data.check_ins')
            ->assertJsonPath('data.check_ins.0.type', 'departure')
            ->assertJsonPath('data.check_ins.1.type', 'arrival');
        $this->assertDatabaseCount('trip_check_ins', 2);
    }

    public function test_location_and_check_ins_are_limited_to_trips_in_progress(): void
    {
        [$owner, $passenger, $offer] = $this->createActiveTrip(['status' => 'oferta-activa']);

        $this->actingAs($passenger, 'sanctum')->postJson("/api/trips/{$offer->id}/location", [
            'latitude' => 3.45,
            'longitude' => -76.53,
        ])->assertConflict();
        $this->actingAs($passenger, 'sanctum')->postJson("/api/trips/{$offer->id}/check-ins", [
            'type' => 'arrival',
        ])->assertConflict();

        $offer->update(['status' => 'completada']);
        $this->actingAs($owner, 'sanctum')->getJson("/api/trips/{$offer->id}/safety")->assertConflict();
    }

    public function test_completing_a_trip_removes_precise_live_locations(): void
    {
        [$owner, $passenger, $offer] = $this->createActiveTrip();
        $this->actingAs($passenger, 'sanctum')->postJson("/api/trips/{$offer->id}/location", [
            'latitude' => 3.45,
            'longitude' => -76.53,
        ])->assertOk();

        $this->actingAs($owner, 'sanctum')->patchJson("/api/trips/{$offer->id}", [
            'status' => 'completada',
        ])->assertOk();

        $this->assertDatabaseCount('trip_locations', 0);
        $this->assertDatabaseHas('travel_offers', ['id' => $offer->id, 'status' => 'completada']);
    }

    public function test_stale_live_locations_are_not_returned_to_trip_participants(): void
    {
        [$owner, $passenger, $offer] = $this->createActiveTrip();
        $this->actingAs($passenger, 'sanctum')->postJson("/api/trips/{$offer->id}/location", [
            'latitude' => 3.45,
            'longitude' => -76.53,
        ])->assertOk();

        $location = $offer->locations()->firstOrFail();
        $location->update(['captured_at' => Carbon::now()->subMinutes(3)]);

        $this->actingAs($owner, 'sanctum')->getJson("/api/trips/{$offer->id}/safety")
            ->assertOk()
            ->assertJsonCount(0, 'data.locations');
        $this->assertDatabaseCount('trip_locations', 1);
    }

    public function test_expired_locations_are_pruned_but_recent_locations_are_retained(): void
    {
        [, $oldPassenger, $oldOffer] = $this->createActiveTrip();
        [, $currentPassenger, $currentOffer] = $this->createActiveTrip();
        $retentionHours = (int) config('viajau.safety.location_retention_hours');

        TripLocation::create([
            'travel_offer_id' => $oldOffer->id,
            'user_id' => $oldPassenger->id,
            'latitude' => 3.45,
            'longitude' => -76.53,
            'captured_at' => Carbon::now()->subHours($retentionHours + 1),
        ]);
        TripLocation::create([
            'travel_offer_id' => $currentOffer->id,
            'user_id' => $currentPassenger->id,
            'latitude' => 3.46,
            'longitude' => -76.52,
            'captured_at' => Carbon::now()->subHours($retentionHours)->addMinute(),
        ]);

        $this->artisan('viajau:prune-trip-locations')->assertSuccessful();

        $this->assertDatabaseMissing('trip_locations', ['travel_offer_id' => $oldOffer->id]);
        $this->assertDatabaseHas('trip_locations', ['travel_offer_id' => $currentOffer->id]);
        $this->assertDatabaseCount('trip_locations', 1);
    }

    public function test_invalid_location_coordinates_are_rejected(): void
    {
        [, $passenger, $offer] = $this->createActiveTrip();

        $this->actingAs($passenger, 'sanctum')->postJson("/api/trips/{$offer->id}/location", [
            'latitude' => -91,
            'longitude' => -76.53,
        ])->assertUnprocessable();
    }

    private function createActiveTrip(array $offerAttributes = []): array
    {
        $owner = User::factory()->create();
        $ownerProfile = $this->createProfile($owner);
        $passenger = User::factory()->create();
        $passengerProfile = $this->createProfile($passenger);
        $offer = TravelOffer::create(array_merge([
            'student_profile_id' => $ownerProfile->id,
            'origin' => 'UNIAJC',
            'destination' => 'El Caney',
            'mode' => 'MIO',
            'departure_time' => '19:45',
            'seats' => 1,
            'cost' => '2500 COP',
            'status' => 'en-curso',
        ], $offerAttributes));

        TripRequest::create([
            'travel_offer_id' => $offer->id,
            'requester_profile_id' => $passengerProfile->id,
            'status' => 'accepted',
        ]);

        return [$owner, $passenger, $offer];
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
