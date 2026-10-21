<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MembershipTest extends TestCase
{
    use RefreshDatabase;

    public function test_free_period_starts_at_account_creation_and_no_payment_is_collected(): void
    {
        $user = User::factory()->create([
            'role' => User::ROLE_STUDENT,
            'status' => User::STATUS_ACTIVE,
            'email_verified_at' => now(),
        ]);
        $expectedEnd = $user->created_at->copy()->addMonthsNoOverflow(6)->toDateString();

        $this->actingAs($user, 'sanctum')->getJson('/api/membership')
            ->assertOk()
            ->assertJsonPath('data.status', 'free_trial')
            ->assertJsonPath('data.trial_starts_at', $user->created_at->toDateString())
            ->assertJsonPath('data.trial_ends_at', $expectedEnd)
            ->assertJsonPath('data.monthly_price_cop', 9000)
            ->assertJsonPath('data.payments_enabled', false)
            ->assertJsonPath('data.access_restricted', false)
            ->assertJsonPath('message', 'Tu uso es gratuito durante los primeros seis meses. No se realizará ningún cobro.');
    }

    public function test_ended_trial_displays_upcoming_membership_without_charging_or_blocking_access(): void
    {
        $user = User::factory()->create([
            'role' => User::ROLE_STUDENT,
            'status' => User::STATUS_ACTIVE,
            'email_verified_at' => now(),
        ]);
        $user->forceFill(['created_at' => now()->subMonthsNoOverflow(7)])->saveQuietly();

        $this->actingAs($user, 'sanctum')->getJson('/api/membership')
            ->assertOk()
            ->assertJsonPath('data.status', 'awaiting_payment_provider')
            ->assertJsonPath('data.monthly_price_cop', 9000)
            ->assertJsonPath('data.payments_enabled', false)
            ->assertJsonPath('data.access_restricted', false);
        $this->getJson('/api/me')->assertOk();
    }
}
