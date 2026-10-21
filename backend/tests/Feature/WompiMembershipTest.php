<?php

namespace Tests\Feature;

use App\Models\MembershipPayment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WompiMembershipTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'membership.wompi.enabled' => true,
            'membership.wompi.public_key' => 'pub_test_example',
            'membership.wompi.integrity_secret' => 'test_integrity_example',
            'membership.wompi.events_secret' => 'test_events_example',
        ]);
    }

    public function test_checkout_is_sandbox_signed_server_side_and_reuses_pending_reference(): void
    {
        $user = $this->createPastTrialStudent();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/membership/wompi/checkout')
            ->assertCreated()
            ->assertJsonPath('data.environment', 'sandbox')
            ->assertJsonPath('data.amount_in_cents', 900000)
            ->assertJsonPath('data.currency', 'COP')
            ->assertJsonPath('data.public_key', 'pub_test_example')
            ->assertJsonPath('message', 'Checkout de pruebas. Este resultado no activa una membresía ni representa un cobro real.');

        $reference = $response->json('data.reference');
        $this->assertSame(
            hash('sha256', $reference.'900000COPtest_integrity_example'),
            $response->json('data.signature.integrity'),
        );
        $this->assertSame(
            $reference,
            $this->actingAs($user, 'sanctum')->postJson('/api/membership/wompi/checkout')->json('data.reference'),
        );
        $this->assertDatabaseCount('membership_payments', 1);
        $this->assertDatabaseHas('membership_payments', [
            'user_id' => $user->id,
            'reference' => $reference,
            'amount_in_cents' => 900000,
            'environment' => 'sandbox',
            'status' => 'pending',
        ]);
    }

    public function test_wompi_webhook_checks_signature_and_exact_checkout_amount_and_is_idempotent(): void
    {
        $user = $this->createPastTrialStudent();
        $payment = MembershipPayment::create([
            'user_id' => $user->id,
            'provider' => 'wompi',
            'reference' => 'membership-reference-123',
            'amount_in_cents' => 900000,
            'currency' => 'COP',
            'environment' => 'sandbox',
            'status' => 'pending',
        ]);
        $event = $this->signedEvent($payment, 'APPROVED', 'wompi-txn-1');

        $this->postJson('/api/payments/wompi/webhook', $event, [
            'X-Event-Checksum' => $event['signature']['checksum'],
        ])->assertOk()->assertJsonPath('received', true);
        $this->assertDatabaseHas('membership_payments', [
            'id' => $payment->id,
            'status' => 'approved',
            'gateway_transaction_id' => 'wompi-txn-1',
        ]);

        $outdatedEvent = $this->signedEvent($payment, 'DECLINED', 'wompi-txn-1');
        $this->postJson('/api/payments/wompi/webhook', $outdatedEvent, [
            'X-Event-Checksum' => $outdatedEvent['signature']['checksum'],
        ])->assertOk();
        $this->assertDatabaseHas('membership_payments', [
            'id' => $payment->id,
            'status' => 'approved',
        ]);
        $this->actingAs($user, 'sanctum')->getJson('/api/membership')
            ->assertOk()
            ->assertJsonPath('data.payments_enabled', false)
            ->assertJsonPath('data.access_restricted', false)
            ->assertJsonPath('data.latest_sandbox_payment.status', 'approved');
    }

    public function test_invalid_event_signature_amount_environment_and_unrelated_transaction_are_rejected(): void
    {
        $user = $this->createPastTrialStudent();
        $payment = MembershipPayment::create([
            'user_id' => $user->id,
            'provider' => 'wompi',
            'reference' => 'membership-reference-456',
            'amount_in_cents' => 900000,
            'currency' => 'COP',
            'environment' => 'sandbox',
            'status' => 'pending',
        ]);

        $event = $this->signedEvent($payment, 'APPROVED', 'wompi-txn-2');
        $event['data']['transaction']['amount_in_cents'] = 100;
        $this->postJson('/api/payments/wompi/webhook', $event, [
            'X-Event-Checksum' => $event['signature']['checksum'],
        ])->assertUnauthorized();

        $event = $this->signedEvent($payment, 'APPROVED', 'wompi-txn-2');
        $event['environment'] = 'prod';
        $this->postJson('/api/payments/wompi/webhook', $event, [
            'X-Event-Checksum' => $event['signature']['checksum'],
        ])->assertBadRequest();

        $event = $this->signedEvent($payment, 'APPROVED', 'wompi-txn-2');
        $event['data']['transaction']['reference'] = 'unknown-reference';
        $this->postJson('/api/payments/wompi/webhook', $event, [
            'X-Event-Checksum' => $event['signature']['checksum'],
        ])->assertNotFound();

        $event = $this->signedEvent($payment, 'APPROVED', 'wompi-txn-2');
        $event['signature']['checksum'] = str_repeat('0', 64);
        $this->postJson('/api/payments/wompi/webhook', $event, [
            'X-Event-Checksum' => str_repeat('0', 64),
        ])->assertUnauthorized();

        $this->assertDatabaseHas('membership_payments', [
            'id' => $payment->id,
            'status' => 'pending',
            'gateway_transaction_id' => null,
        ]);
    }

    public function test_wompi_checkout_is_blocked_during_free_trial_and_without_test_keys(): void
    {
        $activeTrialUser = User::factory()->create([
            'role' => User::ROLE_STUDENT,
            'status' => User::STATUS_ACTIVE,
        ]);
        $this->actingAs($activeTrialUser, 'sanctum')
            ->postJson('/api/membership/wompi/checkout')
            ->assertConflict();

        $pastTrialUser = $this->createPastTrialStudent();
        config(['membership.wompi.integrity_secret' => 'prod_integrity_wrong_environment']);
        $this->actingAs($pastTrialUser, 'sanctum')
            ->postJson('/api/membership/wompi/checkout')
            ->assertServiceUnavailable();
        $this->assertDatabaseCount('membership_payments', 0);
    }

    private function createPastTrialStudent(): User
    {
        $user = User::factory()->create([
            'role' => User::ROLE_STUDENT,
            'status' => User::STATUS_ACTIVE,
            'email_verified_at' => now(),
        ]);
        $user->forceFill(['created_at' => now()->subMonthsNoOverflow(7)])->saveQuietly();

        return $user;
    }

    private function signedEvent(MembershipPayment $payment, string $status, string $transactionId): array
    {
        $timestamp = now()->timestamp;
        $transaction = [
            'id' => $transactionId,
            'status' => $status,
            'amount_in_cents' => $payment->amount_in_cents,
        ];
        $signatureProperties = ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'];
        $signatureContent = $transactionId.$status.$payment->amount_in_cents.$timestamp.'test_events_example';

        return [
            'event' => 'transaction.updated',
            'environment' => 'test',
            'timestamp' => $timestamp,
            'data' => [
                'transaction' => [
                    ...$transaction,
                    'reference' => $payment->reference,
                    'currency' => $payment->currency,
                ],
            ],
            'signature' => [
                'properties' => $signatureProperties,
                'checksum' => hash('sha256', $signatureContent),
            ],
        ];
    }
}
