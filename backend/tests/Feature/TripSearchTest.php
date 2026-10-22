<?php

namespace Tests\Feature;

use App\Models\StudentProfile;
use App\Models\TravelOffer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class TripSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_search_returns_only_available_offers_from_other_verified_students_without_private_fields(): void
    {
        $viewer = User::factory()->create();
        $viewerProfile = $this->createProfile($viewer);
        $this->createOffer($viewerProfile, ['origin' => 'Mi barrio']);

        $driver = User::factory()->create(['name' => 'Ana Conductora']);
        $driverProfile = $this->createProfile($driver, [
            'name' => 'Ana Conductora',
            'career' => 'Ingeniería',
            'university' => 'UNIAJC',
        ]);
        $activeOffer = $this->createOffer($driverProfile, [
            'origin' => 'El Caney',
            'destination' => 'UNIAJC',
            'departure_time' => '19:45',
            'mode' => 'MIO + caminata',
        ]);
        $this->createOffer($driverProfile, ['seats' => 0]);
        $this->createOffer($driverProfile, ['status' => 'cancelada']);

        $hiddenDriver = User::factory()->create();
        $hiddenProfile = $this->createProfile($hiddenDriver, ['verified' => false]);
        $this->createOffer($hiddenProfile);

        $token = $viewer->createToken('web')->plainTextToken;
        $response = $this->withToken($token)->getJson('/api/trips');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $activeOffer->id)
            ->assertJsonPath('data.0.departure_date', today()->addDay()->toDateString())
            ->assertJsonPath('data.0.name', 'Ana Conductora')
            ->assertJsonPath('data.0.university', 'UNIAJC')
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.limit', 100)
            ->assertJsonPath('meta.truncated', false)
            ->assertJsonMissingPath('data.0.email')
            ->assertJsonMissingPath('data.0.emergency_contact');
    }

    public function test_search_filters_by_zone_hour_mode_career_and_university(): void
    {
        $viewer = User::factory()->create();
        $driver = User::factory()->create();
        $profile = $this->createProfile($driver, [
            'career' => 'Ingeniería de Sistemas',
            'university' => 'UNIAJC',
        ]);
        $matchingOffer = $this->createOffer($profile, [
            'origin' => 'El Caney',
            'destination' => 'Campus sur',
            'departure_time' => '19:45',
            'mode' => 'MIO + caminata',
        ]);
        $this->createOffer($profile, [
            'origin' => 'Pance',
            'destination' => 'Campus sur',
            'departure_time' => '20:15',
            'mode' => 'Carro',
        ]);
        $token = $viewer->createToken('web')->plainTextToken;

        $this->withToken($token)->getJson(
            '/api/trips?zone=Caney&time=19%3A10&transport=MIO&faculty=Ingenier%C3%ADa&university=UNIAJC',
        )->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $matchingOffer->id);
    }

    public function test_search_paginates_all_matching_results_with_a_stable_cursor(): void
    {
        $viewer = User::factory()->create();
        $this->createProfile($viewer);
        $driver = User::factory()->create();
        $profile = $this->createProfile($driver);

        for ($index = 0; $index < 101; $index++) {
            $this->createOffer($profile);
        }

        $token = $viewer->createToken('web')->plainTextToken;
        $firstPage = $this->withToken($token)->getJson('/api/trips')->assertOk()
            ->assertJsonCount(100, 'data')
            ->assertJsonPath('meta.total', 101)
            ->assertJsonPath('meta.limit', 100)
            ->assertJsonPath('meta.truncated', true);
        $lastId = $firstPage->json('data.99.id');
        $this->withToken($token)->getJson("/api/trips?after_id={$lastId}")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.total', 101)
            ->assertJsonPath('meta.truncated', false)
            ->assertJsonPath('meta.next_after_id', null);
    }

    public function test_high_traffic_trip_queries_have_supporting_composite_indexes(): void
    {
        $this->assertContains('travel_offers_status_departure_index', Schema::getIndexListing('travel_offers'));
        $this->assertContains('travel_offers_status_date_time_index', Schema::getIndexListing('travel_offers'));
        $this->assertContains('travel_offers_profile_created_index', Schema::getIndexListing('travel_offers'));
        $this->assertContains(
            'student_profiles_verified_status_user_index',
            Schema::getIndexListing('student_profiles'),
        );
        $this->assertContains(
            'trip_requests_requester_status_created_index',
            Schema::getIndexListing('trip_requests'),
        );
        $this->assertContains('safety_alerts_active_created_index', Schema::getIndexListing('safety_alerts'));
        $this->assertContains('trip_messages_offer_id_index', Schema::getIndexListing('trip_messages'));
    }

    public function test_matches_require_authentication_and_verified_email(): void
    {
        $this->getJson('/api/matches')->assertUnauthorized();

        $user = User::factory()->unverified()->create();
        $token = $user->createToken('web')->plainTextToken;

        $this->withToken($token)->getJson('/api/matches')->assertForbidden();
    }

    public function test_matches_are_read_only_and_do_not_accept_client_supplied_scores(): void
    {
        $user = User::factory()->create();
        $profile = $this->createProfile($user);
        $token = $user->createToken('web')->plainTextToken;

        $this->withToken($token)->postJson('/api/matches', [
            'student_profile_id' => $profile->id,
            'matched_student_id' => $profile->id,
            'score' => 100,
        ])->assertMethodNotAllowed();

        $this->assertDatabaseCount('trip_matches', 0);
    }

    public function test_matches_are_ranked_with_explanations_and_exclude_private_or_unverified_data(): void
    {
        $viewer = User::factory()->create();
        $this->createProfile($viewer, [
            'neighborhood' => 'El Caney',
            'shift' => 'Nocturna',
            'transport' => 'MIO + caminata',
        ]);

        $candidate = User::factory()->create(['name' => 'Ana Conductora']);
        $profile = $this->createProfile($candidate, [
            'name' => 'Ana Conductora',
            'neighborhood' => 'Pance',
            'shift' => 'Tarde',
            'transport' => 'MIO + caminata',
        ]);
        $matchingOffer = $this->createOffer($profile, [
            'origin' => 'El Caney',
            'destination' => 'UNIAJC',
            'departure_time' => '19:45',
            'mode' => 'MIO + caminata',
        ]);
        $this->createOffer($profile, [
            'origin' => 'Pance',
            'destination' => 'Centro',
            'departure_time' => '13:45',
            'mode' => 'MIO + caminata',
        ]);
        $partialMatch = $this->createOffer($profile, [
            'origin' => 'Centro',
            'destination' => 'UNIAJC',
            'departure_time' => '19:15',
            'mode' => 'MIO + caminata',
        ]);
        $selfOffer = $this->createOffer($viewer->studentProfile, [
            'origin' => 'El Caney',
            'departure_time' => '20:00',
        ]);

        $unverifiedUser = User::factory()->create();
        $unverifiedProfile = $this->createProfile($unverifiedUser, ['verified' => false]);
        $this->createOffer($unverifiedProfile, ['origin' => 'El Caney']);

        $token = $viewer->createToken('web')->plainTextToken;
        $response = $this->withToken($token)->getJson('/api/matches');

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $matchingOffer->id)
            ->assertJsonPath('data.0.traveler', 'Ana Conductora')
            ->assertJsonPath('data.0.score', 100)
            ->assertJsonPath('data.0.reasons.0', 'El recorrido pasa por tu zona declarada')
            ->assertJsonPath('data.0.reasons.1', 'La salida coincide con tu jornada declarada')
            ->assertJsonPath('data.0.reasons.2', 'Coincide con tu transporte preferido')
            ->assertJsonPath('data.1.id', $partialMatch->id)
            ->assertJsonPath('data.1.score', 50)
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('meta.evaluated', 3)
            ->assertJsonPath('meta.truncated', false)
            ->assertJsonMissingPath('data.0.email')
            ->assertJsonMissingPath('data.0.emergency_contact');

        $this->assertDatabaseHas('travel_offers', ['id' => $selfOffer->id]);
    }

    public function test_matches_return_an_explicit_empty_state_when_the_viewer_has_no_verified_profile(): void
    {
        $viewer = User::factory()->create();
        $token = $viewer->createToken('web')->plainTextToken;

        $this->withToken($token)->getJson('/api/matches')->assertOk()
            ->assertJsonCount(0, 'data')
            ->assertJsonPath('meta.reason', 'profile_unavailable');
    }

    public function test_matches_do_not_treat_a_malformed_legacy_departure_time_as_a_night_match(): void
    {
        $viewer = User::factory()->create();
        $this->createProfile($viewer, [
            'neighborhood' => 'El Caney',
            'shift' => 'Nocturna',
            'transport' => 'MIO',
        ]);

        $candidate = User::factory()->create();
        $profile = $this->createProfile($candidate);
        $offer = $this->createOffer($profile, [
            'origin' => 'El Caney',
            'departure_time' => 'invalid-time',
            'mode' => 'MIO',
        ]);
        $token = $viewer->createToken('web')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/matches');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $offer->id)
            ->assertJsonPath('data.0.score', 65);

        $this->assertNotContains('La salida coincide con tu jornada declarada', $response->json('data.0.reasons'));
    }

    public function test_matches_require_a_whole_declared_neighborhood_in_the_route(): void
    {
        $viewer = User::factory()->create();
        $this->createProfile($viewer, [
            'neighborhood' => 'Caney',
            'shift' => 'Mañana',
            'transport' => 'Carro',
        ]);

        $candidate = User::factory()->create();
        $profile = $this->createProfile($candidate);
        $matchingOffer = $this->createOffer($profile, [
            'origin' => 'El Caney',
            'destination' => 'Campus',
            'departure_time' => '09:00',
            'mode' => 'Carro',
        ]);
        $this->createOffer($profile, [
            'origin' => 'Caneywood',
            'destination' => 'Campus',
            'departure_time' => '13:00',
            'mode' => 'Bus',
        ]);
        $token = $viewer->createToken('web')->plainTextToken;

        $this->withToken($token)->getJson('/api/matches')->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $matchingOffer->id)
            ->assertJsonPath('data.0.score', 100);
    }

    public function test_matches_can_be_scanned_past_the_first_evaluation_batch(): void
    {
        $viewer = User::factory()->create();
        $this->createProfile($viewer, [
            'neighborhood' => null,
            'shift' => 'Tarde',
            'transport' => null,
        ]);

        $candidate = User::factory()->create();
        $profile = $this->createProfile($candidate);
        for ($index = 0; $index < 201; $index++) {
            $this->createOffer($profile, ['departure_time' => '13:00']);
        }
        $token = $viewer->createToken('web')->plainTextToken;

        $firstPage = $this->withToken($token)->getJson('/api/matches')->assertOk()
            ->assertJsonCount(200, 'data')
            ->assertJsonPath('meta.total', 201)
            ->assertJsonPath('meta.evaluated', 200)
            ->assertJsonPath('meta.truncated', true);
        $lastId = $firstPage->json('meta.next_after_id');
        $this->withToken($token)->getJson("/api/matches?after_id={$lastId}")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.total', 201)
            ->assertJsonPath('meta.evaluated', 1)
            ->assertJsonPath('meta.truncated', false)
            ->assertJsonPath('meta.next_after_id', null);
    }

    public function test_search_and_matches_exclude_past_or_undated_offers(): void
    {
        $viewer = User::factory()->create();
        $this->createProfile($viewer, [
            'neighborhood' => 'El Caney',
            'shift' => 'Nocturna',
            'transport' => 'MIO',
        ]);
        $driver = User::factory()->create();
        $profile = $this->createProfile($driver);
        $pastOffer = $this->createOffer($profile, [
            'departure_date' => today()->subDay()->toDateString(),
            'origin' => 'El Caney',
        ]);
        $undatedOffer = $this->createOffer($profile, [
            'departure_date' => null,
            'origin' => 'El Caney',
        ]);

        $token = $viewer->createToken('web')->plainTextToken;
        $this->withToken($token)->getJson('/api/trips')->assertOk()->assertJsonCount(0, 'data');
        $this->withToken($token)->getJson('/api/matches')->assertOk()->assertJsonCount(0, 'data');
        $this->assertDatabaseHas('travel_offers', ['id' => $pastOffer->id]);
        $this->assertDatabaseHas('travel_offers', ['id' => $undatedOffer->id, 'departure_date' => null]);
    }

    public function test_trip_creation_requires_a_future_date_and_time(): void
    {
        $user = User::factory()->create();
        $profile = $this->createProfile($user);
        $token = $user->createToken('web')->plainTextToken;

        $this->withToken($token)->postJson('/api/trips', [
            'student_profile_id' => $profile->id,
            'origin' => 'El Caney',
            'destination' => 'UNIAJC',
            'departure_date' => today()->subDay()->toDateString(),
            'departure_time' => '19:45',
        ])->assertUnprocessable()->assertJsonValidationErrors('departure_date');

        $this->withToken($token)->postJson('/api/trips', [
            'student_profile_id' => $profile->id,
            'origin' => 'El Caney',
            'destination' => 'UNIAJC',
            'departure_date' => today()->toDateString(),
            'departure_time' => now()->subMinute()->format('H:i'),
        ])->assertUnprocessable()->assertJsonValidationErrors('departure_time');
    }

    public function test_trip_creation_rejects_malformed_departure_time(): void
    {
        $user = User::factory()->create();
        $profile = $this->createProfile($user);
        $token = $user->createToken('web')->plainTextToken;

        $this->withToken($token)->postJson('/api/trips', [
            'student_profile_id' => $profile->id,
            'origin' => 'El Caney',
            'destination' => 'UNIAJC',
            'departure_date' => today()->addDay()->toDateString(),
            'departure_time' => '25:90',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('departure_time');
    }

    public function test_search_rejects_invalid_time_filters(): void
    {
        $viewer = User::factory()->create();
        $token = $viewer->createToken('web')->plainTextToken;

        $this->withToken($token)->getJson('/api/trips?time=evening')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('time');
    }

    public function test_search_requires_authentication_and_a_verified_email(): void
    {
        $this->getJson('/api/trips')->assertUnauthorized();

        $unverifiedUser = User::factory()->unverified()->create();
        $token = $unverifiedUser->createToken('web')->plainTextToken;

        $this->withToken($token)->getJson('/api/trips')->assertForbidden();
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
