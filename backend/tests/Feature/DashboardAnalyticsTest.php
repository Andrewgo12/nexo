<?php

namespace Tests\Feature;

use App\Models\SafetyAlert;
use App\Models\StudentProfile;
use App\Models\TravelOffer;
use App\Models\TripRequest;
use App\Models\TripReview;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_dashboard_returns_real_aggregates_without_personal_data(): void
    {
        $first = $this->createStudentProfile('UNIAJC', 'El Caney', 'Mañana');
        $second = $this->createStudentProfile('Icesi', 'San Fernando', 'Noche');
        $activeOffer = $this->createOffer($first, 'en-curso');
        $completedOffer = $this->createOffer($first, 'completada');
        TripReview::create([
            'travel_offer_id' => $completedOffer->id,
            'reviewer_profile_id' => $second->id,
            'reviewee_profile_id' => $first->id,
            'rating' => 5,
        ]);

        TripRequest::create([
            'travel_offer_id' => $activeOffer->id,
            'requester_profile_id' => $second->id,
            'status' => 'accepted',
        ]);
        TripRequest::create([
            'travel_offer_id' => $activeOffer->id,
            'requester_profile_id' => $this->createStudentProfile('UNIAJC', 'El Caney', 'Tarde')->id,
            'status' => 'pending',
        ]);
        SafetyAlert::create([
            'student_profile_id' => $first->id,
            'type' => 'panic',
            'severity' => 'critical',
            'message' => 'SOS',
            'active' => true,
            'latitude' => 3.45,
            'longitude' => -76.53,
        ]);

        $admin = User::factory()->create([
            'role' => User::ROLE_ADMIN,
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('scope.global', true)
            ->assertJsonPath('stats.students', 3)
            ->assertJsonPath('stats.registered_users', 3)
            ->assertJsonPath('stats.trips', 2)
            ->assertJsonPath('stats.active_trips', 1)
            ->assertJsonPath('stats.completed_trips', 1)
            ->assertJsonPath('stats.trip_requests', 2)
            ->assertJsonPath('stats.accepted_requests', 1)
            ->assertJsonPath('stats.request_acceptance_rate', 50)
            ->assertJsonPath('stats.active_alerts', 1)
            ->assertJsonPath('stats.trust_score_avg', 5)
            ->assertJsonPath('distribution.by_neighborhood.0.label', 'El Caney')
            ->assertJsonFragment(['label' => 'UNIAJC', 'total' => 2])
            ->assertJsonFragment(['label' => 'Mañana', 'total' => 1]);

        $response->assertJsonMissingPath('recent_alerts.0.latitude')
            ->assertJsonMissingPath('recent_alerts.0.longitude')
            ->assertJsonMissingPath('recent_trips.0.student_profile_id');
    }

    public function test_university_dashboard_only_includes_its_own_aggregates_and_activity(): void
    {
        $this->createStudentProfile('UNIAJC', 'El Caney', 'Mañana');
        $univalleProfile = $this->createStudentProfile('Univalle', 'Meléndez', 'Tarde');
        $foreignOffer = $this->createOffer($univalleProfile, 'en-curso');
        SafetyAlert::create([
            'student_profile_id' => $univalleProfile->id,
            'type' => 'panic',
            'severity' => 'critical',
            'message' => 'SOS',
            'active' => true,
        ]);
        $institution = User::factory()->create([
            'role' => User::ROLE_UNIVERSITY,
            'university' => 'UNIAJC',
            'email_verified_at' => now(),
        ]);

        $this->actingAs($institution, 'sanctum')->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('scope.global', false)
            ->assertJsonPath('scope.university', 'UNIAJC')
            ->assertJsonPath('stats.students', 1)
            ->assertJsonPath('stats.registered_users', 1)
            ->assertJsonPath('stats.trips', 0)
            ->assertJsonPath('stats.active_alerts', 0)
            ->assertJsonCount(0, 'recent_alerts')
            ->assertJsonCount(0, 'recent_trips')
            ->assertJsonCount(1, 'distribution.by_university');

        $this->assertDatabaseHas('travel_offers', ['id' => $foreignOffer->id]);
    }

    public function test_university_without_an_assigned_institution_does_not_receive_global_analytics(): void
    {
        $this->createStudentProfile('UNIAJC', 'El Caney', 'Mañana');
        $institution = User::factory()->create([
            'role' => User::ROLE_UNIVERSITY,
            'email_verified_at' => now(),
            'university' => null,
        ]);

        $this->actingAs($institution, 'sanctum')->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('scope.global', false)
            ->assertJsonPath('scope.university', null)
            ->assertJsonPath('stats.students', 0)
            ->assertJsonPath('stats.trips', 0)
            ->assertJsonCount(0, 'distribution.by_university');
    }

    private function createStudentProfile(string $university, string $neighborhood, string $shift): StudentProfile
    {
        $user = User::factory()->create([
            'role' => User::ROLE_STUDENT,
            'university' => $university,
        ]);

        return StudentProfile::create([
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'university' => $university,
            'neighborhood' => $neighborhood,
            'shift' => $shift,
            'verified' => true,
            'status' => 'activo',
        ]);
    }

    private function createOffer(StudentProfile $profile, string $status): TravelOffer
    {
        return TravelOffer::create([
            'student_profile_id' => $profile->id,
            'origin' => 'Origen',
            'destination' => 'Destino',
            'mode' => 'Carro',
            'departure_time' => '09:00',
            'seats' => 2,
            'cost' => '0',
            'status' => $status,
        ]);
    }
}
