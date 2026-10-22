<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentProfile;
use App\Models\TravelOffer;
use App\Models\TripCheckIn;
use App\Models\TripLocation;
use App\Models\TripSafetyEvent;
use App\Models\User;
use App\Services\SafetyNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TripSafetyController extends Controller
{
    public function shareTripLocation(
        Request $request,
        TravelOffer $trip,
        SafetyNotificationService $notifications,
    ) {
        $this->assertActiveTripParticipant($request, $trip);

        $data = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'accuracy_meters' => ['nullable', 'integer', 'min:0', 'max:100000'],
        ]);
        $location = DB::transaction(function () use ($request, $trip, $data): TripLocation {
            $lockedTrip = TravelOffer::query()->lockForUpdate()->findOrFail($trip->id);
            abort_unless($lockedTrip->status === 'en-curso', 409, 'La ubicación solo se comparte durante un viaje en curso.');

            return TripLocation::updateOrCreate(
                [
                    'travel_offer_id' => $lockedTrip->id,
                    'user_id' => $request->user()->id,
                ],
                [
                    'latitude' => $data['latitude'],
                    'longitude' => $data['longitude'],
                    'accuracy_meters' => $data['accuracy_meters'] ?? null,
                    'captured_at' => now(),
                ],
            );
        });
        $safetyEvents = [];
        if (
            $trip->safety_route
            && $location->accuracy_meters !== null
            && $location->accuracy_meters <= config('viajau.safety.route_corridor_meters') / 2
        ) {
            $distanceFromRoute = $this->distanceToPolylineMeters(
                (float) $location->latitude,
                (float) $location->longitude,
                $trip->safety_route,
            );
            if ($distanceFromRoute > config('viajau.safety.route_corridor_meters')) {
                $safetyEvents[] = $this->triggerTripSafetyEvent(
                    $trip,
                    $request->user()->id,
                    'route_deviation',
                    $notifications,
                );
            } elseif (
                $this->distanceBetweenCoordinates(
                    (float) $location->latitude,
                    (float) $location->longitude,
                    (float) $trip->safety_route[array_key_last($trip->safety_route)][0],
                    (float) $trip->safety_route[array_key_last($trip->safety_route)][1],
                ) <= config('viajau.safety.arrival_radius_meters')
            ) {
                $safetyEvents[] = $this->triggerTripSafetyEvent(
                    $trip,
                    $request->user()->id,
                    'arrival_geofence',
                    $notifications,
                );
            }
        }

        return response()->json([
            'message' => 'Ubicación compartida con los participantes del viaje.',
            'data' => [
                'id' => $location->id,
                'captured_at' => $location->captured_at?->toISOString(),
                'safety_events' => $safetyEvents,
            ],
        ]);
    }

    public function stopSharingTripLocation(Request $request, TravelOffer $trip)
    {
        $this->assertActiveTripParticipant($request, $trip);
        $deleted = $trip->locations()->where('user_id', $request->user()->id)->delete();

        return response()->json([
            'message' => 'Tu ubicación actual fue retirada del viaje.',
            'data' => ['location_removed' => $deleted > 0],
        ]);
    }

    public function tripSafetyStatus(Request $request, TravelOffer $trip)
    {
        $this->assertActiveTripParticipant($request, $trip);
        abort_unless($trip->status === 'en-curso', 409, 'La información de seguridad solo está disponible durante un viaje en curso.');

        $locations = $trip->locations()
            ->with('user:id,name,university')
            ->where('captured_at', '>=', now()->subMinutes(2))
            ->get()
            ->map(fn (TripLocation $location): array => [
                'user_id' => $location->user_id,
                'name' => $location->user->name,
                'university' => $location->user->university,
                'latitude' => $location->latitude,
                'longitude' => $location->longitude,
                'accuracy_meters' => $location->accuracy_meters,
                'captured_at' => $location->captured_at?->toISOString(),
            ])
            ->values();

        $checkIns = $trip->checkIns()
            ->with('user:id,name,university')
            ->orderBy('checked_in_at')
            ->orderBy('id')
            ->get()
            ->map(fn (TripCheckIn $checkIn): array => [
                'user_id' => $checkIn->user_id,
                'name' => $checkIn->user->name,
                'university' => $checkIn->user->university,
                'type' => $checkIn->type,
                'checked_in_at' => $checkIn->checked_in_at?->toISOString(),
            ])
            ->values();
        $safetyEvents = $trip->safetyEvents()
            ->with('deliveries:id,trip_safety_event_id,channel,status,failure_reason')
            ->orderBy('occurred_at')
            ->get()
            ->map(fn (TripSafetyEvent $event): array => [
                'user_id' => $event->user_id,
                'type' => $event->type,
                'occurred_at' => $event->occurred_at?->toISOString(),
                'notifications' => $event->deliveries->map(fn ($delivery): array => [
                    'channel' => $delivery->channel,
                    'status' => $delivery->status,
                    'failure_reason' => $delivery->failure_reason,
                ])->values(),
            ])
            ->values();

        return response()->json([
            'data' => [
                'locations' => $locations,
                'check_ins' => $checkIns,
                'safety_events' => $safetyEvents,
            ],
        ]);
    }

    public function createTripCheckIn(Request $request, TravelOffer $trip)
    {
        $this->assertActiveTripParticipant($request, $trip);
        abort_unless($trip->status === 'en-curso', 409, 'El check-in solo está disponible durante un viaje en curso.');

        $data = $request->validate([
            'type' => ['required', Rule::in(['departure', 'arrival'])],
        ]);
        $checkIn = DB::transaction(function () use ($request, $trip, $data): TripCheckIn {
            $lockedTrip = TravelOffer::query()->lockForUpdate()->findOrFail($trip->id);
            abort_unless($lockedTrip->status === 'en-curso', 409, 'El check-in solo está disponible durante un viaje en curso.');

            $record = TripCheckIn::query()->firstOrCreate(
                [
                    'travel_offer_id' => $lockedTrip->id,
                    'user_id' => $request->user()->id,
                    'type' => $data['type'],
                ],
                ['checked_in_at' => now()],
            );
            abort_if(! $record->wasRecentlyCreated, 409, 'Ya registraste este check-in.');

            return $record;
        });

        return response()->json([
            'message' => 'Check-in registrado.',
            'data' => [
                'type' => $checkIn->type,
                'checked_in_at' => $checkIn->checked_in_at?->toISOString(),
            ],
        ], 201);
    }

    private function assertActiveTripParticipant(Request $request, TravelOffer $trip): StudentProfile
    {
        $this->assertActiveAccount($request);
        $profile = $request->user()->studentProfile;
        abort_unless(
            $profile && $profile->verified && $profile->status === 'activo',
            403,
            'Necesitas un perfil de estudiante activo y verificado.',
        );

        $isOwner = (int) $trip->student_profile_id === (int) $profile->id;
        $isAcceptedPassenger = $trip->requests()
            ->where('requester_profile_id', $profile->id)
            ->where('status', 'accepted')
            ->exists();
        abort_unless($isOwner || $isAcceptedPassenger, 403, 'Solo los participantes aceptados pueden ver la seguridad de este viaje.');

        return $profile;
    }

    private function assertActiveAccount(Request $request): void
    {
        $status = User::query()
            ->whereKey($request->user()->getAuthIdentifier())
            ->value('status');

        abort_unless($status === User::STATUS_ACTIVE, 403, 'La cuenta debe estar activa.');
    }

    private function triggerTripSafetyEvent(
        TravelOffer $trip,
        int $userId,
        string $type,
        SafetyNotificationService $notifications,
    ): array {
        $event = $notifications->trigger([
            'travel_offer_id' => $trip->id,
            'user_id' => $userId,
            'type' => $type,
        ]);

        return [
            'type' => $event->type,
            'occurred_at' => $event->occurred_at?->toISOString(),
            'notifications' => $this->notificationDeliverySummaries($event),
        ];
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

    private function distanceToPolylineMeters(float $latitude, float $longitude, array $polyline): float
    {
        $earthRadius = 6371000;
        $minimumDistance = INF;
        $latitudeRadians = deg2rad($latitude);
        $longitudeScale = cos($latitudeRadians);
        $previous = null;

        foreach ($polyline as $point) {
            if ($previous !== null) {
                $startX = deg2rad((float) $previous[1] - $longitude) * $earthRadius * $longitudeScale;
                $startY = deg2rad((float) $previous[0] - $latitude) * $earthRadius;
                $endX = deg2rad((float) $point[1] - $longitude) * $earthRadius * $longitudeScale;
                $endY = deg2rad((float) $point[0] - $latitude) * $earthRadius;
                $segmentX = $endX - $startX;
                $segmentY = $endY - $startY;
                $segmentLengthSquared = $segmentX ** 2 + $segmentY ** 2;
                $projection = $segmentLengthSquared > 0
                    ? max(0, min(1, -($startX * $segmentX + $startY * $segmentY) / $segmentLengthSquared))
                    : 0;
                $distance = hypot($startX + $projection * $segmentX, $startY + $projection * $segmentY);
                $minimumDistance = min($minimumDistance, $distance);
            }
            $previous = $point;
        }

        return $minimumDistance;
    }

    private function distanceBetweenCoordinates(
        float $latitude,
        float $longitude,
        float $destinationLatitude,
        float $destinationLongitude,
    ): float {
        $latitudeDelta = deg2rad($destinationLatitude - $latitude);
        $longitudeDelta = deg2rad($destinationLongitude - $longitude);
        $value = sin($latitudeDelta / 2) ** 2
            + cos(deg2rad($latitude)) * cos(deg2rad($destinationLatitude))
            * sin($longitudeDelta / 2) ** 2;

        return 6371000 * 2 * atan2(sqrt($value), sqrt(1 - $value));
    }
}
