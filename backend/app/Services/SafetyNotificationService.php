<?php

namespace App\Services;

use App\Jobs\SendSafetyNotification;
use App\Models\SafetyNotificationDelivery;
use App\Models\TripSafetyEvent;
use Illuminate\Support\Facades\Log;
use Throwable;

class SafetyNotificationService
{
    public function trigger(array $eventAttributes): TripSafetyEvent
    {
        $event = TripSafetyEvent::query()->firstOrCreate(
            $eventAttributes,
            ['occurred_at' => now()],
        );
        $user = $event->user;

        if (! $user->trusted_contact_consent) {
            return $event;
        }

        $channels = [
            'email' => $user->trusted_contact_email,
            'sms' => $user->trusted_contact_phone,
            'whatsapp' => $user->trusted_contact_phone,
        ];

        foreach ($channels as $channel => $recipient) {
            $recipientHash = $recipient
                ? hash('sha256', strtolower(trim($recipient)))
                : null;
            $delivery = SafetyNotificationDelivery::query()->firstOrCreate(
                [
                    'trip_safety_event_id' => $event->id,
                    'channel' => $channel,
                ],
                [
                    'status' => 'pending',
                    'recipient_hash' => $recipientHash,
                ],
            );
            $wasRecentlyCreated = $delivery->wasRecentlyCreated;

            if (! $recipient) {
                if ($delivery->status !== 'sent') {
                    $delivery->update([
                        'status' => 'skipped',
                        'failure_reason' => $channel === 'email'
                            ? 'El contacto no tiene un correo configurado.'
                            : 'El contacto no tiene un teléfono configurado.',
                    ]);
                }

                continue;
            }

            $skipReason = $this->unavailableReason($channel);
            if ($skipReason) {
                $delivery->update([
                    'status' => 'skipped',
                    'failure_reason' => $skipReason,
                ]);

                continue;
            }

            $recipientChanged = $delivery->recipient_hash !== $recipientHash;
            if ($recipientChanged) {
                $delivery->update([
                    'status' => 'pending',
                    'recipient_hash' => $recipientHash,
                    'failure_reason' => null,
                ]);
            } elseif ($delivery->status !== 'skipped' && ! $wasRecentlyCreated) {
                continue;
            }

            if (! $wasRecentlyCreated && ! $recipientChanged) {
                $delivery->update([
                    'status' => 'pending',
                    'failure_reason' => null,
                ]);
            }

            try {
                SendSafetyNotification::dispatch($delivery->id)->onQueue('safety');
            } catch (Throwable $exception) {
                $delivery->update([
                    'status' => 'failed',
                    'failure_reason' => 'No se pudo poner la notificación en cola.',
                ]);
                Log::error('Safety notification could not be queued.', [
                    'delivery_id' => $delivery->id,
                    'exception' => $exception->getMessage(),
                ]);
            }
        }

        return $event->fresh('deliveries');
    }

    private function unavailableReason(string $channel): ?string
    {
        if ($channel === 'email') {
            return in_array(config('mail.default'), ['log', 'array', 'null'], true)
                ? 'El correo saliente no está configurado para entrega real.'
                : null;
        }

        $config = config('services.twilio');
        $from = $channel === 'whatsapp' ? $config['whatsapp_from'] : $config['from'];

        return ! $config['account_sid'] || ! $config['auth_token'] || ! $from
            ? 'El canal Twilio no está configurado.'
            : null;
    }
}
