<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentProfile;
use App\Models\TravelOffer;
use App\Models\TripRequest;
use App\Services\DashboardAnalyticsService;
use App\Services\StudentProfileUpdateService;
use App\Services\TravelOfferSearchService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ViajauController extends Controller
{
    public function showStudent(Request $request, string $id)
    {
        $profile = StudentProfile::where('user_id', $request->user()->id)->findOrFail($id);

        return response()->json(['data' => $profile]);
    }

    public function updateProfile(Request $request, string $id, StudentProfileUpdateService $profileUpdater)
    {
        $profile = StudentProfile::where('user_id', $request->user()->id)->findOrFail($id);
        $data = $request->validate($profileUpdater->validationRules());
        $profileUpdater->update($request->user(), $data, $profile);

        return response()->json([
            'message' => 'Perfil actualizado.',
            'data' => $profile,
        ]);
    }

    public function listTrips(Request $request, TravelOfferSearchService $search)
    {
        $filters = $request->validate([
            'zone' => ['nullable', 'string', 'max:120'],
            'time' => ['nullable', 'date_format:H:i'],
            'faculty' => ['nullable', 'string', 'max:120'],
            'university' => ['nullable', 'string', 'max:120'],
            'transport' => ['nullable', 'string', 'max:120'],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
            'after_id' => ['nullable', 'integer', 'min:1'],
        ]);

        return response()->json($search->search((int) $request->user()->id, $filters));
    }

    public function createTrip(Request $request)
    {
        $data = Validator::make($request->all(), [
            'student_profile_id' => [
                'sometimes',
                Rule::exists('student_profiles', 'id')->where('user_id', $request->user()->id),
            ],
            'origin' => 'required|string|max:120',
            'destination' => 'required|string|max:120',
            'mode' => 'nullable|string|max:80',
            'departure_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'departure_time' => ['nullable', 'date_format:H:i'],
            'seats' => 'nullable|integer|min:1|max:20',
            'cost' => 'nullable|string|max:40',
            'safety_route' => ['prohibited'],
            'safety_route_duration_minutes' => ['prohibited'],
        ])->validate();
        $departureTime = $data['departure_time'] ?? '19:45';
        if (
            $data['departure_date'] === today()->toDateString()
            && ! today()->setTimeFromTimeString($departureTime)->isFuture()
        ) {
            throw ValidationException::withMessages([
                'departure_time' => ['La hora de salida debe ser futura para la fecha seleccionada.'],
            ]);
        }

        $profile = $request->user()->studentProfile;
        abort_unless(
            $profile && $profile->verified && $profile->status === 'activo',
            403,
            'Necesitas un perfil de estudiante verificado para publicar ofertas.',
        );
        abort_unless(
            ! isset($data['student_profile_id']) || (int) $data['student_profile_id'] === (int) $profile->id,
            403,
        );

        $trip = TravelOffer::create([
            'student_profile_id' => $profile->id,
            'origin' => $data['origin'],
            'destination' => $data['destination'],
            'mode' => $data['mode'] ?? 'MIO + caminata',
            'departure_date' => $data['departure_date'],
            'departure_time' => $departureTime,
            'seats' => $data['seats'] ?? 2,
            'cost' => $data['cost'] ?? '2500 COP',
            'status' => 'oferta-activa',
        ]);

        return response()->json([
            'message' => 'Oferta de viaje creada.',
            'data' => [
                'id' => $trip->id,
                'student_profile_id' => $trip->student_profile_id,
                'origin' => $trip->origin,
                'destination' => $trip->destination,
                'departure_date' => $trip->departure_date?->toDateString(),
                'departure_time' => $trip->departure_time,
                'status' => $trip->status,
                'safety_geofence_enabled' => false,
                'safety_geofence_reason' => 'server_route_verification_required',
            ],
        ], 201);
    }

    public function myTrips(Request $request)
    {
        $filters = $request->validate([
            'offers_before_id' => ['sometimes', 'integer', 'min:1'],
            'requests_before_id' => ['sometimes', 'integer', 'min:1'],
        ]);
        $profile = $request->user()->studentProfile;
        abort_unless(
            $profile && $profile->verified && $profile->status === 'activo',
            403,
            'Necesitas un perfil de estudiante activo y verificado para gestionar viajes.',
        );

        $offers = TravelOffer::query()
            ->where('student_profile_id', $profile->id)
            ->when(
                isset($filters['offers_before_id']),
                fn ($query) => $query->where('id', '<', $filters['offers_before_id']),
            )
            ->with(['requests.requesterProfile:id,name,university'])
            ->orderByDesc('id')
            ->limit(101)
            ->get();
        $offersHaveOlder = $offers->count() > 100;
        if ($offersHaveOlder) {
            $offers = $offers->take(100);
        }
        $offersBeforeId = $offersHaveOlder ? $offers->last()?->id : null;
        $offers = $offers->map(fn (TravelOffer $offer): array => [
            'id' => $offer->id,
            'origin' => $offer->origin,
            'destination' => $offer->destination,
            'departure_date' => $offer->departure_date?->toDateString(),
            'mode' => $offer->mode,
            'departure_time' => $offer->departure_time,
            'seats' => $offer->seats,
            'cost' => $offer->cost,
            'status' => $offer->status,
            'requests' => $offer->requests->map(fn (TripRequest $tripRequest): array => [
                'id' => $tripRequest->id,
                'status' => $tripRequest->status,
                'requester' => [
                    'name' => $tripRequest->requesterProfile->name,
                    'university' => $tripRequest->requesterProfile->university,
                ],
            ])->values(),
        ]);

        $requests = TripRequest::query()
            ->where('requester_profile_id', $profile->id)
            ->when(
                isset($filters['requests_before_id']),
                fn ($query) => $query->where('id', '<', $filters['requests_before_id']),
            )
            ->with(['travelOffer.studentProfile:id,name,university'])
            ->orderByDesc('id')
            ->limit(101)
            ->get();
        $requestsHaveOlder = $requests->count() > 100;
        if ($requestsHaveOlder) {
            $requests = $requests->take(100);
        }
        $requestsBeforeId = $requestsHaveOlder ? $requests->last()?->id : null;
        $requests = $requests->map(fn (TripRequest $tripRequest): array => [
            'id' => $tripRequest->id,
            'status' => $tripRequest->status,
            'offer' => [
                'id' => $tripRequest->travelOffer->id,
                'origin' => $tripRequest->travelOffer->origin,
                'destination' => $tripRequest->travelOffer->destination,
                'departure_date' => $tripRequest->travelOffer->departure_date?->toDateString(),
                'departure_time' => $tripRequest->travelOffer->departure_time,
                'seats' => $tripRequest->travelOffer->seats,
                'status' => $tripRequest->travelOffer->status,
                'owner' => $tripRequest->travelOffer->studentProfile->name,
            ],
        ]);

        return response()->json([
            'data' => ['offers' => $offers->values(), 'requests' => $requests->values()],
            'meta' => [
                'offers_has_older' => $offersHaveOlder,
                'offers_before_id' => $offersBeforeId,
                'requests_has_older' => $requestsHaveOlder,
                'requests_before_id' => $requestsBeforeId,
            ],
        ]);
    }

    public function createTripRequest(Request $request, TravelOffer $trip)
    {
        $profile = $request->user()->studentProfile;
        abort_unless(
            $profile && $profile->verified && $profile->status === 'activo',
            403,
            'Necesitas un perfil de estudiante activo y verificado para solicitar cupos.',
        );

        $tripRequest = DB::transaction(function () use ($profile, $trip): TripRequest {
            $lockedTrip = TravelOffer::query()->lockForUpdate()->findOrFail($trip->id);
            abort_if($lockedTrip->student_profile_id === $profile->id, 422, 'No puedes solicitar un cupo en tu propia oferta.');
            abort_unless($lockedTrip->status === 'oferta-activa' && $lockedTrip->seats > 0, 409, 'La oferta ya no tiene cupos disponibles.');
            abort_unless($lockedTrip->isUpcoming(), 409, 'La oferta ya venció.');
            abort_if(
                TripRequest::query()
                    ->where('travel_offer_id', $lockedTrip->id)
                    ->where('requester_profile_id', $profile->id)
                    ->exists(),
                409,
                'Ya existe una solicitud para esta oferta.',
            );

            return TripRequest::create([
                'travel_offer_id' => $lockedTrip->id,
                'requester_profile_id' => $profile->id,
                'status' => 'pending',
            ]);
        });

        return response()->json([
            'message' => 'Solicitud de cupo enviada al responsable de la oferta.',
            'data' => [
                'id' => $tripRequest->id,
                'status' => $tripRequest->status,
            ],
        ], 201);
    }

    public function updateTripRequest(Request $request, TripRequest $tripRequest)
    {
        $data = $request->validate([
            'status' => ['required', 'in:accepted,rejected,cancelled'],
        ]);

        $updatedRequest = DB::transaction(function () use ($request, $tripRequest, $data): TripRequest {
            $profile = $request->user()->studentProfile;
            abort_unless(
                $profile && $profile->verified && $profile->status === 'activo',
                403,
                'Necesitas un perfil de estudiante activo y verificado para gestionar solicitudes.',
            );

            $requestRecord = TripRequest::query()->findOrFail($tripRequest->id);
            $offer = TravelOffer::query()->lockForUpdate()->findOrFail($requestRecord->travel_offer_id);
            $lockedRequest = TripRequest::query()->lockForUpdate()->findOrFail($tripRequest->id);

            $profileId = $profile->id;
            $isOwner = (int) $offer->student_profile_id === (int) $profileId;
            $isRequester = (int) $lockedRequest->requester_profile_id === (int) $profileId;
            $status = $data['status'];
            $ownerCanResolve = $isOwner && $lockedRequest->status === 'pending' && in_array($status, ['accepted', 'rejected'], true);
            $requesterCanCancel = $isRequester && $status === 'cancelled' && in_array($lockedRequest->status, ['pending', 'accepted'], true);

            abort_unless($ownerCanResolve || $requesterCanCancel, 403, 'No tienes permiso para cambiar el estado de esta solicitud.');

            if ($status === 'accepted') {
                abort_unless($offer->status === 'oferta-activa' && $offer->seats > 0, 409, 'La oferta ya no tiene cupos disponibles.');
                abort_unless($offer->isUpcoming(), 409, 'La oferta ya venció.');
                $offer->decrement('seats');
            } elseif ($status === 'cancelled') {
                abort_unless($offer->status === 'oferta-activa', 409, 'La oferta ya no está activa.');
                if ($lockedRequest->status === 'accepted') {
                    $offer->increment('seats');
                }
            }

            $lockedRequest->update(['status' => $status]);

            return $lockedRequest->fresh();
        });

        return response()->json([
            'message' => 'Estado de la solicitud actualizado.',
            'data' => [
                'id' => $updatedRequest->id,
                'status' => $updatedRequest->status,
            ],
        ]);
    }

    public function cancelTrip(Request $request, TravelOffer $trip)
    {
        $data = $request->validate([
            'status' => ['required', 'in:en-curso,completada,cancelada'],
        ]);
        $profile = $request->user()->studentProfile;
        abort_unless(
            $profile && $profile->verified && $profile->status === 'activo',
            403,
            'Necesitas un perfil de estudiante activo y verificado para gestionar viajes.',
        );

        DB::transaction(function () use ($profile, $trip, $data): void {
            $lockedTrip = TravelOffer::query()->lockForUpdate()->findOrFail($trip->id);
            abort_unless(
                (int) $lockedTrip->student_profile_id === (int) $profile->id,
                403,
                'Solo quien publicó la oferta puede cambiar su estado.',
            );

            $nextStatus = $data['status'];
            $validTransition = match ($lockedTrip->status) {
                'oferta-activa' => in_array($nextStatus, ['en-curso', 'cancelada'], true),
                'en-curso' => $nextStatus === 'completada',
                default => false,
            };
            abort_unless($validTransition, 409, 'La oferta no permite esa transición de estado.');
            if ($nextStatus === 'en-curso') {
                abort_unless(
                    $lockedTrip->requests()->where('status', 'accepted')->exists(),
                    409,
                    'Acepta al menos un pasajero antes de iniciar el viaje.',
                );
            }

            $tripChanges = ['status' => $nextStatus];
            if ($nextStatus === 'en-curso') {
                $startedAt = now();
                $tripChanges['started_at'] = $startedAt;
                $tripChanges['arrival_checkin_deadline_at'] = $lockedTrip->safety_route_verified
                    && $lockedTrip->safety_route_duration_minutes
                    ? $startedAt->copy()->addMinutes(
                        $lockedTrip->safety_route_duration_minutes
                        + config('viajau.safety.checkin_grace_minutes'),
                    )
                    : null;
            }
            if (in_array($nextStatus, ['completada', 'cancelada'], true)) {
                $tripChanges['safety_route'] = null;
                $tripChanges['safety_route_duration_minutes'] = null;
                $tripChanges['safety_geofence_consent_at'] = null;
                $tripChanges['safety_route_verified'] = false;
                $tripChanges['arrival_checkin_deadline_at'] = null;
                $lockedTrip->locations()->delete();
            }
            $lockedTrip->fill($tripChanges);
            if (in_array($nextStatus, ['completada', 'cancelada'], true)) {
                $lockedTrip->safety_route_verified = false;
            }
            $lockedTrip->save();
            if ($nextStatus === 'en-curso') {
                $lockedTrip->requests()->where('status', 'pending')->update(['status' => 'cancelled']);
            } elseif ($nextStatus === 'cancelada') {
                $lockedTrip->requests()
                    ->whereIn('status', ['pending', 'accepted'])
                    ->update(['status' => 'cancelled']);
            }
        });

        return response()->json(['message' => 'Estado del viaje actualizado.']);
    }

    public function dashboard(Request $request, DashboardAnalyticsService $analytics)
    {
        return response()->json($analytics->build($request->user()));
    }
}
