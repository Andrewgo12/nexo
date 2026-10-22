<?php

namespace Tests\Feature;

use App\Models\InsuranceEnrollment;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class InsuranceTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_request_a_quote_but_the_request_is_not_coverage(): void
    {
        [$student] = $this->createStudent();

        $this->actingAs($student, 'sanctum')->getJson('/api/insurance/products')
            ->assertOk()
            ->assertJsonPath('data.0.price_status', 'quote_required')
            ->assertJsonPath('data.0.monthly_budget_cop', 30000);

        $enrollmentId = $this->actingAs($student, 'sanctum')->postJson('/api/insurance/enrollments', [
            'product_key' => 'mapfre-accidentes-escolares',
        ])->assertCreated()
            ->assertJsonPath('data.status', 'quote_requested')
            ->json('data.id');

        $this->actingAs($student, 'sanctum')->getJson('/api/insurance/enrollments/mine')
            ->assertOk()
            ->assertJsonPath('data.0.id', $enrollmentId)
            ->assertJsonPath('data.0.status', 'quote_requested')
            ->assertJsonPath('data.0.monthly_premium_cop', null);

        $this->assertDatabaseHas('insurance_enrollments', [
            'id' => $enrollmentId,
            'user_id' => $student->id,
            'status' => 'quote_requested',
            'policy_document_path' => null,
        ]);
        $this->actingAs($student, 'sanctum')->postJson('/api/insurance/enrollments', [
            'product_key' => 'mapfre-accidentes-escolares',
        ])->assertConflict();
    }

    public function test_only_admin_can_quote_and_student_must_submit_a_policy_before_activation(): void
    {
        [$student] = $this->createStudent();
        $admin = User::factory()->create([
            'role' => User::ROLE_ADMIN,
            'status' => User::STATUS_ACTIVE,
            'email_verified_at' => now(),
        ]);
        $enrollment = InsuranceEnrollment::create([
            'user_id' => $student->id,
            'product_key' => 'mapfre-accidentes-escolares',
            'provider' => 'MAPFRE',
            'product_name' => 'Accidentes Escolares',
            'status' => 'quote_requested',
        ]);

        $this->actingAs($student, 'sanctum')->patchJson("/api/admin/insurance/enrollments/{$enrollment->id}", [
            'status' => 'quoted',
            'monthly_premium_cop' => 25000,
            'coverage_summary' => 'Cobertura confirmada por el proveedor para accidentes.',
        ])->assertForbidden();

        $this->actingAs($admin, 'sanctum')->patchJson("/api/admin/insurance/enrollments/{$enrollment->id}", [
            'status' => 'active',
        ])->assertConflict();
        $this->actingAs($admin, 'sanctum')->patchJson("/api/admin/insurance/enrollments/{$enrollment->id}", [
            'status' => 'quoted',
            'monthly_premium_cop' => 25000,
            'coverage_summary' => 'Cobertura confirmada por el proveedor para accidentes.',
        ])->assertOk()->assertJsonPath('data.status', 'quoted');

        Storage::fake('local');
        $this->actingAs($student, 'sanctum')->post("/api/insurance/enrollments/{$enrollment->id}/policy", [
            'policy_number' => 'POL-2026-001',
            'coverage_starts_at' => today()->toDateString(),
            'coverage_ends_at' => now()->addYear()->toDateString(),
            'policy_document' => UploadedFile::fake()->create('poliza.pdf', 20, 'application/pdf'),
        ])->assertCreated()->assertJsonPath('data.status', 'pending_review');

        $enrollment->refresh();
        $this->assertSame('pending_review', $enrollment->status);
        Storage::disk('local')->assertExists($enrollment->policy_document_path);
        $this->actingAs($admin, 'sanctum')->getJson('/api/admin/insurance/enrollments')
            ->assertOk()
            ->assertJsonPath('data.0.has_policy_document', true);
        $this->actingAs($admin, 'sanctum')->get("/api/admin/insurance/enrollments/{$enrollment->id}/document")
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');
        $this->actingAs($admin, 'sanctum')->patchJson("/api/admin/insurance/enrollments/{$enrollment->id}", [
            'status' => 'active',
        ])->assertOk()->assertJsonPath('data.status', 'active');
    }

    public function test_policy_upload_is_private_owned_and_capped_at_the_configured_budget(): void
    {
        [$student] = $this->createStudent();
        [$otherStudent] = $this->createStudent();
        $enrollment = InsuranceEnrollment::create([
            'user_id' => $student->id,
            'product_key' => 'mundial-salud-esencial',
            'provider' => 'Seguros Mundial',
            'product_name' => 'Salud Mundial Esencial',
            'monthly_premium_cop' => 30001,
            'status' => 'quoted',
        ]);
        $otherEnrollment = InsuranceEnrollment::create([
            'user_id' => $otherStudent->id,
            'product_key' => 'mundial-salud-esencial',
            'provider' => 'Seguros Mundial',
            'product_name' => 'Salud Mundial Esencial',
            'monthly_premium_cop' => 25000,
            'status' => 'quoted',
        ]);

        Storage::fake('local');
        $this->actingAs($student, 'sanctum')->post("/api/insurance/enrollments/{$enrollment->id}/policy", [
            'policy_number' => 'POL-OVER-BUDGET',
            'coverage_starts_at' => now()->addDay()->toDateString(),
            'coverage_ends_at' => now()->addYear()->toDateString(),
            'policy_document' => UploadedFile::fake()->create('poliza.pdf', 20, 'application/pdf'),
        ])->assertUnprocessable();

        $this->actingAs($student, 'sanctum')->post("/api/insurance/enrollments/{$otherEnrollment->id}/policy", [
            'policy_number' => 'POL-OTHER-USER',
            'coverage_starts_at' => now()->addDay()->toDateString(),
            'coverage_ends_at' => now()->addYear()->toDateString(),
            'policy_document' => UploadedFile::fake()->create('poliza.pdf', 20, 'application/pdf'),
        ])->assertNotFound();
        $this->actingAs($student, 'sanctum')->getJson("/api/admin/insurance/enrollments/{$otherEnrollment->id}/document")
            ->assertForbidden();
        $this->assertDatabaseHas('insurance_enrollments', [
            'id' => $enrollment->id,
            'status' => 'quoted',
            'policy_document_path' => null,
        ]);
    }

    public function test_admin_cannot_activate_a_policy_before_its_coverage_start_date(): void
    {
        [$student] = $this->createStudent();
        $admin = User::factory()->create([
            'role' => User::ROLE_ADMIN,
            'status' => User::STATUS_ACTIVE,
            'email_verified_at' => now(),
        ]);
        Storage::fake('local');
        $documentPath = UploadedFile::fake()
            ->create('poliza.pdf', 20, 'application/pdf')
            ->store('insurance/policies', 'local');
        $enrollment = InsuranceEnrollment::create([
            'user_id' => $student->id,
            'product_key' => 'mapfre-accidentes-escolares',
            'provider' => 'MAPFRE',
            'product_name' => 'Accidentes Escolares',
            'monthly_premium_cop' => 25000,
            'coverage_summary' => 'Cobertura confirmada por el proveedor para accidentes.',
            'policy_number' => 'POL-FUTURE',
            'coverage_starts_at' => today()->addDay(),
            'coverage_ends_at' => today()->addYear(),
            'policy_document_path' => $documentPath,
            'status' => 'pending_review',
        ]);

        $this->actingAs($admin, 'sanctum')->patchJson("/api/admin/insurance/enrollments/{$enrollment->id}", [
            'status' => 'active',
        ])->assertConflict();
        $this->assertDatabaseHas('insurance_enrollments', [
            'id' => $enrollment->id,
            'status' => 'pending_review',
        ]);
    }

    public function test_policy_document_is_removed_when_enrollment_update_rolls_back(): void
    {
        [$student] = $this->createStudent();
        $enrollment = InsuranceEnrollment::create([
            'user_id' => $student->id,
            'product_key' => 'mapfre-accidentes-escolares',
            'provider' => 'MAPFRE',
            'product_name' => 'Accidentes Escolares',
            'monthly_premium_cop' => 25000,
            'status' => 'quoted',
        ]);
        Storage::fake('local');
        DB::unprepared(
            'CREATE TRIGGER fail_insurance_enrollment_update BEFORE UPDATE ON insurance_enrollments '
            ."BEGIN SELECT RAISE(ABORT, 'forced update failure'); END;",
        );

        $this->actingAs($student, 'sanctum')->post("/api/insurance/enrollments/{$enrollment->id}/policy", [
            'policy_number' => 'POL-ROLLBACK',
            'coverage_starts_at' => today()->toDateString(),
            'coverage_ends_at' => today()->addYear()->toDateString(),
            'policy_document' => UploadedFile::fake()->create('poliza.pdf', 20, 'application/pdf'),
        ])->assertServerError();

        $this->assertSame([], Storage::disk('local')->allFiles('insurance/policies'));
        $this->assertDatabaseHas('insurance_enrollments', [
            'id' => $enrollment->id,
            'status' => 'quoted',
            'policy_document_path' => null,
        ]);
    }

    public function test_quote_requests_require_an_active_verified_student_and_rejections_need_a_reason(): void
    {
        [$student] = $this->createStudent();
        $pending = User::factory()->create([
            'role' => User::ROLE_STUDENT,
            'status' => User::STATUS_PENDING,
        ]);
        $admin = User::factory()->create([
            'role' => User::ROLE_ADMIN,
            'status' => User::STATUS_ACTIVE,
            'email_verified_at' => now(),
        ]);
        $enrollment = InsuranceEnrollment::create([
            'user_id' => $student->id,
            'product_key' => 'mundial-accidentes-personales',
            'provider' => 'Seguros Mundial',
            'product_name' => 'Accidentes Personales Protegidos',
            'status' => 'quote_requested',
        ]);

        $this->actingAs($pending, 'sanctum')->postJson('/api/insurance/enrollments', [
            'product_key' => 'mundial-accidentes-personales',
        ])->assertForbidden();
        $this->actingAs($admin, 'sanctum')->patchJson("/api/admin/insurance/enrollments/{$enrollment->id}", [
            'status' => 'rejected',
        ])->assertUnprocessable();
        $this->actingAs($admin, 'sanctum')->patchJson("/api/admin/insurance/enrollments/{$enrollment->id}", [
            'status' => 'rejected',
            'review_note' => 'No hay disponibilidad confirmada para esta institución.',
        ])->assertOk()->assertJsonPath('data.status', 'rejected');
    }

    private function createStudent(): array
    {
        $user = User::factory()->create([
            'role' => User::ROLE_STUDENT,
            'status' => User::STATUS_ACTIVE,
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
}
