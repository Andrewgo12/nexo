<?php

namespace App\Jobs;

use App\Models\SafetyNotificationDelivery;
use App\Notifications\SafetyEventNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use RuntimeException;
use Throwable;

class SendSafetyNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(public int $deliveryId) {}

    public function backoff(): array
    {
        return [15, 60];
    }

    public function handle(): void
    {
        $delivery = SafetyNotificationDelivery::query()
            ->with('event.user')
            ->findOrFail($this->deliveryId);

        if ($delivery->status !== 'pending') {
            return;
        }

        $user = $delivery->event->user;
        if (! $user->trusted_contact_consent) {
            $delivery->update([
                'status' => 'skipped',
                'failure_reason' => 'El consentimiento del contacto fue retirado antes del envío.',
            ]);

            return;
        }

        $recipient = match ($delivery->channel) {
            'email' => $user->trusted_contact_email,
            'sms', 'whatsapp' => $user->trusted_contact_phone,
            default => null,
        };
        if (! $recipient || hash('sha256', strtolower(trim($recipient))) !== $delivery->recipient_hash) {
            $delivery->update([
                'status' => 'skipped',
                'failure_reason' => 'El destino cambió después de crear la notificación.',
            ]);

            return;
        }

        $message = $this->messageFor($delivery);
        $providerMessageId = match ($delivery->channel) {
            'email' => $this->sendEmail($recipient, $message),
            'sms' => $this->sendTwilioMessage($recipient, $message, false),
            'whatsapp' => $this->sendTwilioMessage($recipient, $message, true),
        };

        $delivery->update([
            'status' => 'sent',
            'provider_message_id' => $providerMessageId,
            'failure_reason' => null,
            'sent_at' => now(),
        ]);
    }

    public function failed(?Throwable $exception): void
    {
        SafetyNotificationDelivery::query()
            ->whereKey($this->deliveryId)
            ->where('status', 'pending')
            ->update([
                'status' => 'failed',
                'failure_reason' => 'No fue posible entregar la alerta después de varios intentos.',
            ]);

        Log::error('Safety notification delivery failed after retries.', [
            'delivery_id' => $this->deliveryId,
            'exception' => $exception?->getMessage(),
        ]);
    }

    private function messageFor(SafetyNotificationDelivery $delivery): string
    {
        $event = $delivery->event;
        $studentName = $event->user->name;
        $description = match ($event->type) {
            'panic' => 'activó una alerta SOS.',
            'route_deviation' => 'se alejó del corredor de seguridad de su viaje.',
            'arrival_geofence' => 'llegó a la zona de destino de su viaje.',
            'arrival_checkin_overdue' => 'no confirmó su llegada dentro del tiempo previsto.',
            default => 'generó una alerta de seguridad.',
        };

        return "ViajaU: {$studentName} {$description} Contacta a esta persona para confirmar su bienestar. "
            .'Este aviso no sustituye a los servicios de emergencia.';
    }

    private function sendEmail(string $recipient, string $message): ?string
    {
        Notification::route('mail', $recipient)
            ->notify(new SafetyEventNotification($message));

        return null;
    }

    private function sendTwilioMessage(string $recipient, string $message, bool $whatsapp): ?string
    {
        $config = config('services.twilio');
        $from = $whatsapp ? $config['whatsapp_from'] : $config['from'];
        $sid = $config['account_sid'];
        $token = $config['auth_token'];

        if (! $sid || ! $token || ! $from) {
            throw new RuntimeException('El canal Twilio no está configurado.');
        }

        $to = $whatsapp ? 'whatsapp:'.$recipient : $recipient;
        $from = $whatsapp && ! str_starts_with($from, 'whatsapp:')
            ? 'whatsapp:'.$from
            : $from;
        $response = Http::asForm()
            ->withBasicAuth($sid, $token)
            ->timeout(10)
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
                'To' => $to,
                'From' => $from,
                'Body' => $message,
            ]);

        if (! $response->successful() || ! is_string($response->json('sid'))) {
            throw new RuntimeException('Twilio rechazó la notificación.');
        }

        return $response->json('sid');
    }
}
