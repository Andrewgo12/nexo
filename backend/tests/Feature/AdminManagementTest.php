<?php

namespace Tests\Feature;

use App\Models\InstitutionalCatalogEntry;
use App\Models\SafetyAlert;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class AdminManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_students_and_manage_profile_verification_and_account_status(): void
    {
        $student = $this->createStudent('UNIAJC', false);
        $admin = $this->createManager(User::ROLE_ADMIN);

        $this->actingAs($admin, 'sanctum')->getJson('/api/admin/users?verification=pending')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.id', $student->id)
            ->assertJsonPath('data.0.profile_verified', false)
            ->assertJsonMissingPath('data.0.trusted_contact_phone');

        $this->actingAs($admin, 'sanctum')->patchJson("/api/admin/users/{$student->id}", [
            'profile_verified' => true,
        ])->assertOk()->assertJsonPath('data.profile_verified', true);
        $this->assertDatabaseHas('student_profiles', ['user_id' => $student->id, 'verified' => true, 'status' => 'activo']);

        $token = $student->createToken('active-session');
        $this->actingAs($admin, 'sanctum')->patchJson("/api/admin/users/{$student->id}", [
            'status' => User::STATUS_BLOCKED,
        ])->assertOk()->assertJsonPath('data.status', User::STATUS_BLOCKED);
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $token->accessToken->id]);
    }

    public function test_university_manager_is_scoped_to_its_own_students_and_cannot_change_other_universities(): void
    {
        $ownStudent = $this->createStudent('UNIAJC');
        $foreignStudent = $this->createStudent('Icesi');
        $manager = $this->createManager(User::ROLE_UNIVERSITY, 'UNIAJC');

        $this->actingAs($manager, 'sanctum')->getJson('/api/admin/users')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.id', $ownStudent->id);

        $this->actingAs($manager, 'sanctum')->patchJson("/api/admin/users/{$foreignStudent->id}", [
            'status' => User::STATUS_BLOCKED,
        ])->assertNotFound();
        $this->assertSame(User::STATUS_ACTIVE, $foreignStudent->fresh()->status);
    }

    public function test_university_manager_cannot_change_own_status_or_privileged_accounts(): void
    {
        $manager = $this->createManager(User::ROLE_UNIVERSITY, 'UNIAJC');
        $admin = $this->createManager(User::ROLE_ADMIN);

        $this->actingAs($manager, 'sanctum')->patchJson("/api/admin/users/{$manager->id}", [
            'status' => User::STATUS_BLOCKED,
        ])->assertNotFound();
        $this->actingAs($manager, 'sanctum')->patchJson("/api/admin/users/{$admin->id}", [
            'status' => User::STATUS_BLOCKED,
        ])->assertNotFound();
    }

    public function test_unassigned_university_manager_cannot_manage_students_without_profiles(): void
    {
        $student = User::factory()->create([
            'role' => User::ROLE_STUDENT,
            'email_verified_at' => now(),
        ]);
        $manager = $this->createManager(User::ROLE_UNIVERSITY);

        $this->actingAs($manager, 'sanctum')->getJson('/api/admin/users')->assertForbidden();
        $this->actingAs($manager, 'sanctum')->patchJson("/api/admin/users/{$student->id}", [
            'status' => User::STATUS_BLOCKED,
        ])->assertForbidden();

        $this->assertSame(User::STATUS_ACTIVE, $student->fresh()->status);
    }

    public function test_university_scope_uses_the_student_profile_university_as_the_authority(): void
    {
        $student = $this->createStudent('UNIAJC');
        $student->studentProfile()->update(['university' => 'Icesi']);
        $manager = $this->createManager(User::ROLE_UNIVERSITY, 'UNIAJC');

        $this->actingAs($manager, 'sanctum')->getJson('/api/admin/users')
            ->assertOk()
            ->assertJsonPath('meta.total', 0);
        $this->actingAs($manager, 'sanctum')->patchJson("/api/admin/users/{$student->id}", [
            'status' => User::STATUS_BLOCKED,
        ])->assertNotFound();
    }

    public function test_incident_list_is_scoped_and_never_returns_coordinates(): void
    {
        $own = $this->createStudent('UNIAJC');
        $foreign = $this->createStudent('Icesi');
        $ownAlert = $this->createAlert($own);
        $this->createAlert($foreign);
        $manager = $this->createManager(User::ROLE_UNIVERSITY, 'UNIAJC');

        $this->actingAs($manager, 'sanctum')->getJson('/api/admin/incidents?status=all')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.id', $ownAlert->id)
            ->assertJsonMissingPath('data.0.latitude')
            ->assertJsonMissingPath('data.0.longitude');
    }

    public function test_institutional_catalog_is_scoped_and_entries_are_soft_deactivated(): void
    {
        $manager = $this->createManager(User::ROLE_UNIVERSITY, 'UNIAJC');
        $foreign = InstitutionalCatalogEntry::create([
            'university' => 'Icesi',
            'type' => 'campus',
            'name' => 'Sede extranjera',
        ]);

        $response = $this->actingAs($manager, 'sanctum')->postJson('/api/admin/catalog', [
            'type' => 'campus',
            'name' => 'Sede Sur',
        ])->assertCreated()->assertJsonPath('data.university', 'UNIAJC');
        $entryId = $response->json('data.id');

        $this->getJson('/api/admin/catalog')->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Sede Sur');
        $this->postJson('/api/admin/catalog', [
            'type' => 'campus',
            'name' => 'Sede Sur',
        ])->assertStatus(409);
        $this->deleteJson("/api/admin/catalog/{$foreign->id}")->assertNotFound();
        $this->deleteJson("/api/admin/catalog/{$entryId}")->assertOk();
        $this->assertDatabaseHas('institutional_catalog_entries', ['id' => $entryId, 'active' => false]);
    }

    public function test_admin_can_import_a_validated_gtfs_stops_and_routes_snapshot(): void
    {
        $admin = $this->createManager(User::ROLE_ADMIN);

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/admin/transit-feed/import', [
            'feed_version' => 'Metro Cali 2026-10',
            'stops' => UploadedFile::fake()->createWithContent(
                'stops.txt',
                "stop_id,stop_name,stop_lat,stop_lon\nS1,Universidad,3.344,-76.529\nS2,Estación Centro,3.45,-76.53\n",
            ),
            'routes' => UploadedFile::fake()->createWithContent(
                'routes.txt',
                "route_id,route_short_name,route_long_name\nR1,T31,Universidad - Centro\nR2,,Circular Norte\n",
            ),
        ])->assertCreated()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.stops_count', 2)
            ->assertJsonPath('data.routes_count', 2);

        $importId = $response->json('data.id');
        $this->assertDatabaseCount('transit_stops', 2);
        $this->assertDatabaseCount('transit_routes', 2);
        $this->getJson('/api/admin/transit-feed/latest')
            ->assertOk()
            ->assertJsonPath('data.id', $importId)
            ->assertJsonPath('data.feed_version', 'Metro Cali 2026-10');
    }

    public function test_invalid_gtfs_feed_is_rejected_without_creating_partial_import(): void
    {
        $admin = $this->createManager(User::ROLE_ADMIN);

        $this->actingAs($admin, 'sanctum')->postJson('/api/admin/transit-feed/import', [
            'feed_version' => 'invalid',
            'stops' => UploadedFile::fake()->createWithContent(
                'stops.txt',
                "stop_id,stop_name,stop_lat,stop_lon\nS1,Universidad,190,-76.529\n",
            ),
            'routes' => UploadedFile::fake()->createWithContent(
                'routes.txt',
                "route_id,route_short_name,route_long_name\nR1,T31,Universidad - Centro\n",
            ),
        ])->assertUnprocessable();

        $this->assertDatabaseCount('transit_feed_imports', 0);
        $this->assertDatabaseCount('transit_stops', 0);
        $this->assertDatabaseCount('transit_routes', 0);
    }

    public function test_university_role_cannot_import_global_gtfs_data(): void
    {
        $manager = $this->createManager(User::ROLE_UNIVERSITY, 'UNIAJC');

        $this->actingAs($manager, 'sanctum')->postJson('/api/admin/transit-feed/import', [
            'feed_version' => 'not-allowed',
        ])->assertForbidden();
        $this->assertDatabaseCount('transit_feed_imports', 0);
    }

    private function createManager(string $role, ?string $university = null): User
    {
        return User::factory()->create([
            'role' => $role,
            'university' => $university,
            'email_verified_at' => now(),
        ]);
    }

    private function createStudent(string $university, bool $verified = true): User
    {
        $user = User::factory()->create([
            'role' => User::ROLE_STUDENT,
            'university' => $university,
            'email_verified_at' => now(),
        ]);
        StudentProfile::create([
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'university' => $university,
            'verified' => $verified,
            'status' => $verified ? 'activo' : 'pendiente',
        ]);

        return $user;
    }

    private function createAlert(User $user): SafetyAlert
    {
        return SafetyAlert::create([
            'student_profile_id' => $user->studentProfile->id,
            'type' => 'panic',
            'severity' => 'critical',
            'message' => 'SOS',
            'active' => true,
            'latitude' => 3.45,
            'longitude' => -76.53,
        ]);
    }
}
