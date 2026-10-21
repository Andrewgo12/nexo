<?php

namespace Tests\Feature;

use App\Models\SafetyAlert;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SafetyAlertTest extends TestCase
{
    use RefreshDatabase;

    public function test_verified_student_can_create_a_persisted_panic_alert_with_optional_location(): void
    {
        $student = User::factory()->create([
            'email_verified_at' => now(),
            'status' => User::STATUS_ACTIVE,
        ]);
        $profile = $this->createProfile($student);
        $otherStudent = User::factory()->create([
            'email_verified_at' => now(),
            'status' => User::STATUS_ACTIVE,
        ]);
        $otherProfile = $this->createProfile($otherStudent);

        $response = $this->actingAs($student, 'sanctum')->postJson('/api/alerts', [
            'latitude' => 3.4516,
            'longitude' => -76.532,
            'accuracy_meters' => 15,
            'student_profile_id' => $otherProfile->id,
            'type' => 'check-in',
            'severity' => 'low',
            'message' => 'Forged message',
            'active' => false,
        ]);
        $response->assertStatus(201, $response->getContent())
            ->assertJsonPath('data.student_profile_id', $profile->id)
            ->assertJsonPath('data.type', 'panic')
            ->assertJsonPath('data.severity', 'critical')
            ->assertJsonPath('data.active', true)
            ->assertJsonPath('data.latitude', 3.4516)
            ->assertJsonPath('data.longitude', -76.532)
            ->assertJsonPath('data.message', 'El estudiante activó una alerta de emergencia.');

        $this->assertDatabaseHas('safety_alerts', [
            'student_profile_id' => $profile->id,
            'type' => 'panic',
            'severity' => 'critical',
            'active' => true,
            'latitude' => 3.4516,
            'longitude' => -76.532,
            'accuracy_meters' => 15,
        ]);
    }

    public function test_student_can_create_alert_without_location_but_cannot_submit_invalid_coordinates(): void
    {
        $student = User::factory()->create([
            'email_verified_at' => now(),
            'status' => User::STATUS_ACTIVE,
        ]);
        $this->createProfile($student);

        $this->actingAs($student, 'sanctum')->postJson('/api/alerts')->assertStatus(201)
            ->assertJsonPath('data.latitude', null)
            ->assertJsonPath('data.longitude', null);

        $this->actingAs($student, 'sanctum')->postJson('/api/alerts', [
            'latitude' => 91,
            'longitude' => -76,
        ])->assertUnprocessable();
    }

    public function test_unverified_student_profile_cannot_create_an_alert(): void
    {
        $student = User::factory()->create([
            'email_verified_at' => now(),
            'status' => User::STATUS_ACTIVE,
        ]);
        $this->createProfile($student, ['verified' => false]);

        $this->actingAs($student, 'sanctum')->postJson('/api/alerts')->assertForbidden();
        $this->assertDatabaseCount('safety_alerts', 0);
    }

    public function test_blocked_accounts_cannot_create_or_manage_safety_alerts(): void
    {
        $blockedStudent = User::factory()->create([
            'email_verified_at' => now(),
            'status' => User::STATUS_BLOCKED,
        ]);
        $this->createProfile($blockedStudent);
        $this->actingAs($blockedStudent, 'sanctum')->postJson('/api/alerts')->assertForbidden();

        $alert = SafetyAlert::create([
            'type' => 'panic',
            'severity' => 'critical',
            'message' => 'Emergency',
            'active' => true,
        ]);
        $blockedSecurityUser = User::factory()->create([
            'email_verified_at' => now(),
            'role' => User::ROLE_SECURITY,
            'status' => User::STATUS_BLOCKED,
        ]);
        $this->actingAs($blockedSecurityUser, 'sanctum')->getJson('/api/security/alerts')->assertForbidden();
        $this->actingAs($blockedSecurityUser, 'sanctum')
            ->patchJson("/api/security/alerts/{$alert->id}/resolve")
            ->assertForbidden();
    }

    public function test_only_security_staff_can_view_and_resolve_active_alerts(): void
    {
        $student = User::factory()->create(['email_verified_at' => now()]);
        $profile = $this->createProfile($student, [
            'email' => 'private.student@example.test',
            'emergency_contact' => 'Private phone',
        ]);
        $alert = SafetyAlert::create([
            'student_profile_id' => $profile->id,
            'type' => 'panic',
            'severity' => 'critical',
            'message' => 'Emergency',
            'active' => true,
            'latitude' => 3.4516,
            'longitude' => -76.532,
        ]);
        SafetyAlert::create([
            'student_profile_id' => $profile->id,
            'type' => 'panic',
            'severity' => 'critical',
            'message' => 'Already resolved',
            'active' => false,
        ]);

        $this->actingAs($student, 'sanctum')->getJson('/api/security/alerts')->assertForbidden();
        $this->actingAs($student, 'sanctum')->patchJson("/api/security/alerts/{$alert->id}/resolve")->assertForbidden();

        $securityUser = User::factory()->create([
            'email_verified_at' => now(),
            'role' => User::ROLE_SECURITY,
            'status' => User::STATUS_ACTIVE,
        ]);
        $this->actingAs($securityUser, 'sanctum')->getJson('/api/security/alerts')->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $alert->id)
            ->assertJsonPath('data.0.student_profile.name', $profile->name)
            ->assertJsonMissingPath('data.0.student_profile.email')
            ->assertJsonMissingPath('data.0.student_profile.emergency_contact');

        $resolveResponse = $this->actingAs($securityUser, 'sanctum')
            ->patchJson("/api/security/alerts/{$alert->id}/resolve");
        $resolveResponse->assertStatus(200, $resolveResponse->getContent())
            ->assertJsonPath('data.active', false);

        $this->assertDatabaseHas('safety_alerts', [
            'id' => $alert->id,
            'active' => false,
            'resolved_by_user_id' => $securityUser->id,
        ]);
        $this->assertNotNull($alert->fresh()->resolved_at);
    }

    public function test_resolved_alert_cannot_be_resolved_twice(): void
    {
        $securityUser = User::factory()->create([
            'email_verified_at' => now(),
            'role' => User::ROLE_ADMIN,
            'status' => User::STATUS_ACTIVE,
        ]);
        $alert = SafetyAlert::create([
            'type' => 'panic',
            'severity' => 'critical',
            'message' => 'Emergency',
            'active' => false,
        ]);

        $this->actingAs($securityUser, 'sanctum')
            ->patchJson("/api/security/alerts/{$alert->id}/resolve")
            ->assertConflict();
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
}
