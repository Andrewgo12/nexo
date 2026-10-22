<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MembershipPayment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class WompiMembershipController extends Controller
{
    public function createCheckout(Request $request)
    {
        $user = $request->user();
        abort_unless($user->role === User::ROLE_STUDENT && $user->status === User::STATUS_ACTIVE, 403);
        abort_if(
            now()->lt($user->created_at->copy()->addMonthsNoOverflow(config('membership.free_trial_months'))),
            409,
            'Tu periodo gratuito aún está vigente.',
        );
        abort_unless(config('membership.wompi.enabled'), 503, 'El checkout sandbox de Wompi aún no está configurado.');
        abort_unless(
            str_starts_with((string) config('membership.wompi.public_key'), 'pub_test_')
            && str_starts_with((string) config('membership.wompi.integrity_secret'), 'test_integrity_')
            && str_starts_with((string) config('membership.wompi.events_secret'), 'test_events_'),
            503,
            'Wompi solo se permite con llaves y secretos de sandbox.',
        );

        $payment = DB::transaction(function () use ($user): MembershipPayment {
            User::query()->lockForUpdate()->findOrFail($user->id);
            $payment = MembershipPayment::query()
                ->where('user_id', $user->id)
                ->where('status', 'pending')
                ->where('environment', 'sandbox')
                ->latest()
                ->first();
            if ($payment) {
                return $payment;
            }

            $amount = config('membership.monthly_price_cop') * 100;

            return MembershipPayment::create([
                'user_id' => $user->id,
                'provider' => 'wompi',
                'reference' => 'viajau-membership-'.Str::lower(Str::random(32)),
                'amount_in_cents' => $amount,
                'currency' => 'COP',
                'environment' => 'sandbox',
            ]);
        });
        $amount = $payment->amount_in_cents;
        $reference = $payment->reference;
        $integrity = hash('sha256', $reference.$amount.'COP'.config('membership.wompi.integrity_secret'));

        return response()->json([
            'data' => [
                'payment_id' => $payment->id,
                'provider' => 'wompi',
                'environment' => 'sandbox',
                'amount_in_cents' => $amount,
                'currency' => 'COP',
                'reference' => $reference,
                'public_key' => config('membership.wompi.public_key'),
                'signature' => ['integrity' => $integrity],
                'redirect_url' => rtrim(config('viajau.frontend_url'), '/').'/payments/result',
            ],
            'message' => 'Checkout de pruebas. Este resultado no activa una membresía ni representa un cobro real.',
        ], 201);
    }

    public function webhook(Request $request)
    {
        abort_unless(
            str_starts_with((string) config('membership.wompi.events_secret'), 'test_events_'),
            503,
            'El secreto de eventos sandbox Wompi no está configurado.',
        );

        $event = $request->all();
        abort_unless(($event['event'] ?? null) === 'transaction.updated', 400, 'Tipo de evento no soportado.');
        abort_unless(($event['environment'] ?? null) === 'test', 400, 'Solo se aceptan eventos Wompi de sandbox.');

        $data = $event['data'] ?? null;
        $properties = $event['signature']['properties'] ?? null;
        $timestamp = $event['timestamp'] ?? null;
        $checksum = $event['signature']['checksum'] ?? null;
        abort_unless(
            is_array($data)
            && is_array($properties)
            && (is_int($timestamp) || (is_string($timestamp) && ctype_digit($timestamp)))
            && is_string($checksum),
            400,
            'Firma de evento incompleta.',
        );

        $signatureContent = '';
        foreach ($properties as $property) {
            abort_unless(is_string($property) && $property !== '', 400, 'Propiedad de firma inválida.');
            $value = $this->eventProperty($data, $property);
            abort_unless(is_scalar($value), 400, 'Propiedad firmada ausente.');
            $signatureContent .= (string) $value;
        }
        $signatureContent .= (string) $timestamp.config('membership.wompi.events_secret');
        $expectedChecksum = hash('sha256', $signatureContent);
        $headerChecksum = $request->header('X-Event-Checksum');
        abort_unless(
            is_string($headerChecksum)
            && hash_equals(strtolower($expectedChecksum), strtolower($checksum))
            && hash_equals(strtolower($expectedChecksum), strtolower($headerChecksum)),
            401,
            'La firma del evento de Wompi no es válida.',
        );

        $transaction = $data['transaction'] ?? null;
        abort_unless(is_array($transaction), 400, 'El evento no incluye una transacción.');
        $reference = $transaction['reference'] ?? null;
        $status = $transaction['status'] ?? null;
        $transactionId = $transaction['id'] ?? null;
        $amount = $transaction['amount_in_cents'] ?? null;
        $currency = $transaction['currency'] ?? null;
        abort_unless(
            is_string($reference)
            && is_string($status)
            && is_string($transactionId)
            && is_numeric($amount)
            && is_string($currency),
            400,
            'La transacción recibida es inválida.',
        );

        $payment = MembershipPayment::query()->where('reference', $reference)->first();
        abort_unless(
            $payment
            && $payment->environment === 'sandbox'
            && $payment->provider === 'wompi'
            && $payment->amount_in_cents === (int) $amount
            && $payment->currency === $currency,
            404,
            'No existe un checkout sandbox que coincida con esta transacción.',
        );
        abort_unless(
            in_array($status, ['PENDING', 'APPROVED', 'DECLINED', 'VOIDED', 'ERROR'], true),
            400,
            'Estado de transacción no reconocido.',
        );

        if ($payment->gateway_transaction_id && $payment->gateway_transaction_id !== $transactionId) {
            throw ValidationException::withMessages(['transaction' => 'La referencia ya está asociada a otra transacción.']);
        }
        if (MembershipPayment::query()
            ->where('gateway_transaction_id', $transactionId)
            ->where('id', '!=', $payment->id)
            ->exists()) {
            throw ValidationException::withMessages(['transaction' => 'La transacción ya está asociada a otro checkout.']);
        }

        DB::transaction(function () use ($payment, $status, $transactionId): void {
            $lockedPayment = MembershipPayment::query()->lockForUpdate()->findOrFail($payment->id);
            $terminalStatuses = ['approved', 'declined', 'voided', 'error'];
            if (in_array($lockedPayment->status, $terminalStatuses, true)
                && strtolower($status) !== $lockedPayment->status) {
                return;
            }

            $lockedPayment->update([
                'status' => strtolower($status),
                'gateway_transaction_id' => $transactionId,
                'gateway_updated_at' => now(),
            ]);
        });

        return response()->json(['received' => true]);
    }

    private function eventProperty(array $data, string $property): mixed
    {
        $value = $data;
        foreach (explode('.', $property) as $segment) {
            if (! is_array($value) || ! array_key_exists($segment, $value)) {
                return null;
            }
            $value = $value[$segment];
        }

        return $value;
    }
}
