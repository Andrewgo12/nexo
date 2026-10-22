<?php

namespace Tests\Feature;

use App\Models\InsuranceEnrollment;
use App\Models\MembershipPayment;
use App\Models\StudentProfile;
use App\Models\TravelOffer;
use App\Models\TripRequest;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CoreStatusConstraintTest extends TestCase
{
    use RefreshDatabase;

    public function test_core_persisted_status_columns_reject_values_outside_their_domain(): void
    {
        $user = User::factory()->create();
        $profile = StudentProfile::create([
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => 'profile-'.$user->id.'@example.test',
            'university' => 'UNIAJC',
            'verified' => true,
            'status' => 'activo',
        ]);
        $otherUser = User::factory()->create();
        $otherProfile = StudentProfile::create([
            'user_id' => $otherUser->id,
            'name' => $otherUser->name,
            'email' => 'profile-'.$otherUser->id.'@example.test',
            'university' => 'UNIAJC',
            'verified' => true,
            'status' => 'activo',
        ]);
        $offer = TravelOffer::create([
            'student_profile_id' => $profile->id,
            'origin' => 'Origen',
            'destination' => 'Destino',
            'departure_time' => '19:45',
            'seats' => 1,
            'cost' => '2500 COP',
        ]);
        $request = TripRequest::create([
            'travel_offer_id' => $offer->id,
            'requester_profile_id' => $otherProfile->id,
        ]);
        $enrollment = InsuranceEnrollment::create([
            'user_id' => $user->id,
            'product_key' => 'mapfre-accidentes-escolares',
            'provider' => 'MAPFRE',
            'product_name' => 'Accidentes Escolares',
        ]);
        $payment = MembershipPayment::create([
            'user_id' => $user->id,
            'provider' => 'wompi',
            'reference' => 'status-test-reference',
            'amount_in_cents' => 900000,
            'currency' => 'COP',
        ]);

        $this->assertRejectedStatus(fn () => $user->newQuery()->whereKey($user->id)->update(['status' => 'suspended']));
        $this->assertRejectedStatus(fn () => $offer->newQuery()->whereKey($offer->id)->update(['status' => 'expired']));
        $this->assertRejectedStatus(fn () => $request->newQuery()->whereKey($request->id)->update(['status' => 'withdrawn']));
        $this->assertRejectedStatus(fn () => $enrollment->newQuery()->whereKey($enrollment->id)->update(['status' => 'expired']));
        $this->assertRejectedStatus(fn () => $payment->newQuery()->whereKey($payment->id)->update(['status' => 'refunded']));
    }

    private function assertRejectedStatus(callable $write): void
    {
        try {
            $write();
        } catch (QueryException) {
            $this->addToAssertionCount(1);

            return;
        }

        $this->fail('The database accepted an unsupported core status value.');
    }
}
