<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SafetyAlert;
use App\Models\TripSafetyEvent;
use App\Models\User;
use App\Services\SafetyNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SafetyAlertController extends Controller
{
    public function store(Request $request, SafetyNotificationService $notifications)
    {
        $this->assertActiveAccount($request);
        $profile = $request->user()->studentProfile;
        abort_unless(
            $profile && $profile->verified && $profile->status === 'activo',
            403,
            'Necesitas un perfil de estudiante activo y verificado para enviar una alerta.',
        );

        $data = $request->validate([
            'latitude' => ['nullable', 'required_with:longitude', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'required_with:latitude', 'numeric', 'between:-180,180'],
            'accuracy_meters' => ['nullable', 'integer', 'min:0', 'max:100000'],
        ]);

        $alert = SafetyAlert::create([
            'student_profile_id' => $profile->id,
            'type' => 'panic',
            'severity' => 'critical',
            'message' => 'El estudiante activó una alerta de emergencia.',
            'active' => true,
            'latitude' => $data['latitude'] ?? null,
            'longitude' => $data['longitude'] ?? null,
            'accuracy_meters' => $data['accuracy_meters'] ?? null,
        ]);
        $event = $notifications->trigger([
            'safety_alert_id' => $alert->id,
            'user_id' => $request->user()->id,
            'type' => 'panic',
        ]);

        return response()->json([
            'message' => 'Alerta registrada para el equipo de seguridad.',
            'data' => [
                ...$this->alertData($alert),
                'notification_deliveries' => $this->notificationDeliverySummaries($event),
            ],
        ], 201);
    }

    public function index(Request $request)
    {
        $this->assertActiveAccount($request);

        return response()->json([
            'data' => SafetyAlert::query()
                ->select([
                    'id',
                    'student_profile_id',
                    'type',
                    'severity',
                    'message',
                    'active',
                    'latitude',
                    'longitude',
                    'accuracy_meters',
                    'resolved_at',
                    'resolved_by_user_id',
                    'created_at',
                ])
                ->with('studentProfile:id,name,university')
                ->where('active', true)
                ->latest()
                ->limit(100)
                ->get(),
        ]);
    }

    public function resolve(Request $request, SafetyAlert $alert)
    {
        $this->assertActiveAccount($request);

        $resolvedAlert = DB::transaction(function () use ($request, $alert): SafetyAlert {
            $lockedAlert = SafetyAlert::query()->lockForUpdate()->findOrFail($alert->id);
            abort_unless($lockedAlert->active, 409, 'La alerta ya fue atendida.');
            $lockedAlert->update([
                'active' => false,
                'resolved_at' => now(),
                'resolved_by_user_id' => $request->user()->id,
            ]);

            return $lockedAlert->fresh();
        });

        return response()->json([
            'message' => 'Alerta marcada como atendida.',
            'data' => $this->alertData($resolvedAlert),
        ]);
    }

    private function assertActiveAccount(Request $request): void
    {
        $status = User::query()
            ->whereKey($request->user()->getAuthIdentifier())
            ->value('status');

        abort_unless($status === User::STATUS_ACTIVE, 403, 'La cuenta debe estar activa.');
    }

    private function notificationDeliverySummaries(TripSafetyEvent $event): array
    {
        return $event->loadMissing('deliveries')->deliveries
            ->map(fn ($delivery): array => [
                'channel' => $delivery->channel,
                'status' => $delivery->status,
                'failure_reason' => $delivery->failure_reason,
            ])
            ->values()
            ->all();
    }

    private function alertData(SafetyAlert $alert): array
    {
        return [
            'id' => $alert->id,
            'student_profile_id' => $alert->student_profile_id,
            'type' => $alert->type,
            'severity' => $alert->severity,
            'message' => $alert->message,
            'active' => $alert->active,
            'latitude' => $alert->latitude,
            'longitude' => $alert->longitude,
            'accuracy_meters' => $alert->accuracy_meters,
            'resolved_at' => $alert->resolved_at?->toISOString(),
            'created_at' => $alert->created_at?->toISOString(),
        ];
    }
}
