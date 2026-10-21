<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MembershipPayment;
use Illuminate\Http\Request;

class MembershipController extends Controller
{
    public function show(Request $request)
    {
        $trialStartsAt = $request->user()->created_at->copy();
        $trialEndsAt = $trialStartsAt->copy()->addMonthsNoOverflow(config('membership.free_trial_months'));
        $isFreeTrial = now()->lt($trialEndsAt);

        return response()->json([
            'data' => [
                'status' => $isFreeTrial ? 'free_trial' : 'awaiting_payment_provider',
                'trial_starts_at' => $trialStartsAt->toDateString(),
                'trial_ends_at' => $trialEndsAt->toDateString(),
                'days_remaining' => $isFreeTrial
                    ? (int) now()->startOfDay()->diffInDays($trialEndsAt->startOfDay())
                    : 0,
                'monthly_price_cop' => config('membership.monthly_price_cop'),
                'payments_enabled' => config('membership.payments_enabled'),
                'wompi_sandbox_enabled' => config('membership.wompi.enabled'),
                'latest_sandbox_payment' => MembershipPayment::query()
                    ->where('user_id', $request->user()->id)
                    ->where('environment', 'sandbox')
                    ->latest()
                    ->first(['reference', 'status', 'created_at']),
                'access_restricted' => false,
            ],
            'message' => $isFreeTrial
                ? 'Tu uso es gratuito durante los primeros seis meses. No se realizará ningún cobro.'
                : 'El periodo gratuito terminó. La membresía cuesta COP $9.000 al mes, pero los pagos aún no están habilitados y el acceso no se restringe.',
        ]);
    }
}
