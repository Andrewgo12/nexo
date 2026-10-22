<?php

namespace Tests\Feature;

use App\Models\StudentProfile;
use App\Models\TravelOffer;
use App\Models\TripRequest;
use App\Models\TripReview;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReputationTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_completed_trip_participants_can_review_each_other_once(): void
    {
        [$owner, $ownerProfile] = $this->createStudent();
        [$passenger, $passengerProfile] = $this->createStudent();
        [$outsider] = $this->createStudent();
        $trip = $this->createTrip($ownerProfile, 'completada');
        TripRequest::create([
            'travel_offer_id' => $trip->id,
            'requester_profile_id' => $passengerProfile->id,
            'status' => 'accepted',
        ]);

        $reviewResponse = $this->actingAs($passenger, 'sanctum')->postJson("/api/trips/{$trip->id}/reviews", [
            'reviewee_profile_id' => $ownerProfile->id,
            'rating' => 5,
            'comment' => 'Puntual y amable.',
        ]);
        $this->assertSame(201, $reviewResponse->status(), $reviewResponse->getContent());

        $this->actingAs($passenger, 'sanctum')->postJson("/api/trips/{$trip->id}/reviews", [
            'reviewee_profile_id' => $ownerProfile->id,
            'rating' => 3,
        ])->assertConflict();
        $this->flushHeaders()->actingAs($outsider, 'sanctum')->postJson("/api/trips/{$trip->id}/reviews", [
            'reviewee_profile_id' => $ownerProfile->id,
            'rating' => 4,
        ])->assertForbidden();

        $this->assertDatabaseCount('trip_reviews', 1);
        $this->flushHeaders()->actingAs($owner, 'sanctum')->getJson('/api/reputation/me')
            ->assertOk()
            ->assertJsonPath('data.summary.rating_average', 5)
            ->assertJsonPath('data.summary.rating_count', 1)
            ->assertJsonPath('data.received_reviews.0.comment', 'Puntual y amable.');
    }

    public function test_reviews_require_a_completed_trip_and_valid_rating(): void
    {
        [$owner, $ownerProfile] = $this->createStudent();
        [$passenger, $passengerProfile] = $this->createStudent();
        $trip = $this->createTrip($ownerProfile, 'en-curso');
        TripRequest::create([
            'travel_offer_id' => $trip->id,
            'requester_profile_id' => $passengerProfile->id,
            'status' => 'accepted',
        ]);

        $this->actingAs($passenger, 'sanctum')->postJson("/api/trips/{$trip->id}/reviews", [
            'reviewee_profile_id' => $ownerProfile->id,
            'rating' => 5,
        ])->assertConflict();

        $trip->update(['status' => 'completada']);
        $this->actingAs($passenger, 'sanctum')->postJson("/api/trips/{$trip->id}/reviews", [
            'reviewee_profile_id' => $ownerProfile->id,
            'rating' => 6,
        ])->assertUnprocessable();
        $this->assertDatabaseCount('trip_reviews', 0);
    }

    public function test_student_can_report_a_trip_participant_and_only_admin_can_moderate(): void
    {
        [$owner, $ownerProfile] = $this->createStudent();
        [$passenger, $passengerProfile] = $this->createStudent();
        $trip = $this->createTrip($ownerProfile, 'completada');
        TripRequest::create([
            'travel_offer_id' => $trip->id,
            'requester_profile_id' => $passengerProfile->id,
            'status' => 'accepted',
        ]);

        $reportId = $this->actingAs($passenger, 'sanctum')->postJson("/api/trips/{$trip->id}/reports", [
            'reported_profile_id' => $ownerProfile->id,
            'category' => 'safety',
            'description' => 'La conducción fue peligrosa durante el recorrido.',
        ])->assertCreated()->json('data.id');

        $this->actingAs($passenger, 'sanctum')->getJson('/api/admin/reports')
            ->assertForbidden();
        $this->actingAs($passenger, 'sanctum')->postJson("/api/trips/{$trip->id}/reports", [
            'reported_profile_id' => $ownerProfile->id,
            'category' => 'safety',
            'description' => 'La conducción fue peligrosa durante el recorrido.',
        ])->assertConflict();

        $admin = User::factory()->create([
            'role' => User::ROLE_ADMIN,
            'email_verified_at' => now(),
        ]);
        $this->actingAs($admin, 'sanctum')->getJson('/api/admin/reports?status=open')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.id', $reportId)
            ->assertJsonPath('data.0.reporter', $passengerProfile->name);
        $this->actingAs($admin, 'sanctum')->patchJson("/api/admin/reports/{$reportId}", [
            'status' => 'actioned',
            'resolution_note' => 'Se aplicó una advertencia.',
        ])->assertOk()->assertJsonPath('data.status', 'actioned');
        $this->assertDatabaseHas('user_reports', [
            'id' => $reportId,
            'moderator_id' => $admin->id,
            'status' => 'actioned',
            'resolution_note' => 'Se aplicó una advertencia.',
        ]);

        $this->flushHeaders()->actingAs($passenger, 'sanctum')->getJson('/api/reputation/me')
            ->assertOk()
            ->assertJsonPath('data.reports.0.status', 'actioned')
            ->assertJsonPath('data.reports.0.resolution_note', 'Se aplicó una advertencia.');
    }

    public function test_reputation_is_unrated_until_a_real_review_exists(): void
    {
        [$user, $profile] = $this->createStudent();

        $this->actingAs($user, 'sanctum')->getJson("/api/reputation/profiles/{$profile->id}")
            ->assertOk()
            ->assertJsonPath('data.rating_average', null)
            ->assertJsonPath('data.rating_count', 0);
        $this->assertDatabaseHas('student_profiles', ['id' => $profile->id, 'trust_score' => null]);
    }

    public function test_trip_search_shows_only_aggregated_verified_rating_data(): void
    {
        [, $ownerProfile] = $this->createStudent();
        [$reviewer, $reviewerProfile] = $this->createStudent();
        $trip = $this->createTrip($ownerProfile, 'oferta-activa');
        TripReview::create([
            'travel_offer_id' => $trip->id,
            'reviewer_profile_id' => $reviewerProfile->id,
            'reviewee_profile_id' => $ownerProfile->id,
            'rating' => 4,
            'comment' => 'Comentario privado.',
        ]);

        $this->actingAs($reviewer, 'sanctum')->getJson('/api/trips')
            ->assertOk()
            ->assertJsonPath('data.0.profile_id', $ownerProfile->id)
            ->assertJsonPath('data.0.rating_average', 4)
            ->assertJsonPath('data.0.rating_count', 1)
            ->assertJsonMissingPath('data.0.comment');
    }

    private function createStudent(): array
    {
        $user = User::factory()->create([
            'role' => User::ROLE_STUDENT,
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

        return [$user, $profile];
    }

    private function createTrip(StudentProfile $owner, string $status): TravelOffer
    {
        return TravelOffer::create([
            'student_profile_id' => $owner->id,
            'origin' => 'Sede Sur',
            'destination' => 'El Caney',
            'mode' => 'Carro',
            'departure_date' => today()->addDay()->toDateString(),
            'departure_time' => '18:00',
            'seats' => 1,
            'cost' => '0',
            'status' => $status,
        ]);
    }
}
