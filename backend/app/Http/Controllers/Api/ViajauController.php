<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SafetyAlert;
use App\Models\StudentProfile;
use App\Models\TravelOffer;
use App\Models\TripCheckIn;
use App\Models\TripLocation;
use App\Models\TripMatch;
use App\Models\TripRequest;
use App\Models\TrustLedger;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ViajauController extends Controller
{
    public function health()
    {
        return response()->json([
            'status' => 'ok',
            'app' => 'ViajaU',
            'mode' => 'backend-foundation',
            'moment' => now()->toISOString(),
        ]);
    }

    public function showStudent(Request $request, string $id)
    {
        $profile = StudentProfile::where('user_id', $request->user()->id)->findOrFail($id);

        return response()->json(['data' => $profile]);
    }

    public function updateProfile(Request $request, string $id)
    {
        $profile = StudentProfile::where('user_id', $request->user()->id)->findOrFail($id);
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:120',
            'career' => 'sometimes|nullable|string|max:120',
            'semester' => 'sometimes|nullable|string|max:40',
            'shift' => 'sometimes|nullable|string|max:40',
            'neighborhood' => 'sometimes|nullable|string|max:120',
            'transport' => 'sometimes|nullable|string|max:120',
            'emergency_contact' => 'sometimes|nullable|string|max:160',
            'privacy' => 'sometimes|nullable|string|max:120',
        ]);

        $profile->fill($data);

        $profile->save();
        $request->user()->update(collect($data)->only([
            'name',
            'career',
            'semester',
            'shift',
            'neighborhood',
            'emergency_contact',
        ])->all());

        return response()->json([
            'message' => 'Perfil actualizado.',
            'data' => $profile,
        ]);
    }

    public function listTrips(Request $request)
    {
        $filters = $request->validate([
            'zone' => ['nullable', 'string', 'max:120'],
            'time' => ['nullable', 'date_format:H:i'],
            'faculty' => ['nullable', 'string', 'max:120'],
            'university' => ['nullable', 'string', 'max:120'],
            'transport' => ['nullable', 'string', 'max:120'],
        ]);

        $query = TravelOffer::query()
            ->with(['studentProfile:id,user_id,name,university,career'])
            ->where('status', 'oferta-activa')
            ->where('seats', '>', 0)
            ->whereHas('studentProfile', function ($query) use ($request): void {
                $query->where('verified', true)
                    ->where('status', 'activo')
                    ->where('user_id', '<>', $request->user()->id)
                    ->whereHas('user', function ($userQuery): void {
                        $userQuery->where('status', User::STATUS_ACTIVE)
                            ->whereNotNull('email_verified_at');
                    });
            })
            ->when($filters['zone'] ?? null, function ($query, string $zone): void {
                $query->where(function ($routeQuery) use ($zone): void {
                    $routeQuery->where('origin', 'like', '%'.$zone.'%')
                        ->orWhere('destination', 'like', '%'.$zone.'%');
                });
            })
            ->when($filters['time'] ?? null, function ($query, string $time): void {
                $query->where('departure_time', 'like', substr($time, 0, 2).':%');
            })
            ->when($filters['transport'] ?? null, function ($query, string $transport): void {
                $query->where('mode', 'like', '%'.$transport.'%');
            })
            ->when($filters['faculty'] ?? null, function ($query, string $faculty): void {
                $query->whereHas('studentProfile', function ($profileQuery) use ($faculty): void {
                    $profileQuery->where('career', 'like', '%'.$faculty.'%');
                });
            })
            ->when($filters['university'] ?? null, function ($query, string $university): void {
                $query->whereHas('studentProfile', function ($profileQuery) use ($university): void {
                    $profileQuery->where('university', 'like', '%'.$university.'%');
                });
            });
        $total = (clone $query)->count();
        $offers = $query->orderBy('departure_time')
            ->limit(100)
            ->get()
            ->map(fn (TravelOffer $offer): array => [
                'id' => $offer->id,
                'name' => $offer->studentProfile->name,
                'origin' => $offer->origin,
                'destination' => $offer->destination,
                'zone' => $offer->origin.' '.$offer->destination,
                'time' => $offer->departure_time,
                'faculty' => $offer->studentProfile->career,
                'university' => $offer->studentProfile->university,
                'transport' => $offer->mode,
                'seats' => $offer->seats,
                'cost' => $offer->cost,
                'created_at' => $offer->created_at?->toISOString(),
            ])
            ->values();

        return response()->json([
            'data' => $offers,
            'meta' => [
                'total' => $total,
                'limit' => 100,
                'truncated' => $total > 100,
            ],
        ]);
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
            'departure_time' => ['nullable', 'date_format:H:i'],
            'seats' => 'nullable|integer|min:1|max:20',
            'cost' => 'nullable|string|max:40',
        ])->validate();

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
            'departure_time' => $data['departure_time'] ?? '19:45',
            'seats' => $data['seats'] ?? 2,
            'cost' => $data['cost'] ?? '2500 COP',
            'status' => 'oferta-activa',
        ]);

        return response()->json([
            'message' => 'Oferta de viaje creada.',
            'data' => $trip,
        ], 201);
    }

    public function myTrips(Request $request)
    {
        $profile = $request->user()->studentProfile;
        abort_unless(
            $profile && $profile->verified && $profile->status === 'activo',
            403,
            'Necesitas un perfil de estudiante activo y verificado para gestionar viajes.',
        );

        $offers = TravelOffer::query()
            ->where('student_profile_id', $profile->id)
            ->with(['requests.requesterProfile:id,name,university'])
            ->latest()
            ->limit(100)
            ->get()
            ->map(fn (TravelOffer $offer): array => [
                'id' => $offer->id,
                'origin' => $offer->origin,
                'destination' => $offer->destination,
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
            ->with(['travelOffer.studentProfile:id,name,university'])
            ->latest()
            ->limit(100)
            ->get()
            ->map(fn (TripRequest $tripRequest): array => [
                'id' => $tripRequest->id,
                'status' => $tripRequest->status,
                'offer' => [
                    'id' => $tripRequest->travelOffer->id,
                    'origin' => $tripRequest->travelOffer->origin,
                    'destination' => $tripRequest->travelOffer->destination,
                    'departure_time' => $tripRequest->travelOffer->departure_time,
                    'seats' => $tripRequest->travelOffer->seats,
                    'status' => $tripRequest->travelOffer->status,
                    'owner' => $tripRequest->travelOffer->studentProfile->name,
                ],
            ]);

        return response()->json(['data' => ['offers' => $offers, 'requests' => $requests]]);
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

            $lockedTrip->update(['status' => $nextStatus]);
            if (in_array($nextStatus, ['completada', 'cancelada'], true)) {
                $lockedTrip->locations()->delete();
            }
            if (in_array($nextStatus, ['en-curso', 'cancelada'], true)) {
                $lockedTrip->requests()->where('status', 'pending')->update(['status' => 'cancelled']);
            }
        });

        return response()->json(['message' => 'Estado del viaje actualizado.']);
    }

    public function shareTripLocation(Request $request, TravelOffer $trip)
    {
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

        return response()->json([
            'message' => 'Ubicación compartida con los participantes del viaje.',
            'data' => [
                'id' => $location->id,
                'captured_at' => $location->captured_at?->toISOString(),
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

        return response()->json([
            'data' => [
                'locations' => $locations,
                'check_ins' => $checkIns,
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

    public function listMatches(Request $request)
    {
        $viewer = $request->user();
        $profile = $viewer->studentProfile;
        if (! $profile || ! $profile->verified || $profile->status !== 'activo') {
            return response()->json(['data' => [], 'meta' => ['reason' => 'profile_unavailable']]);
        }

        $eligibleOffers = TravelOffer::query()
            ->where('status', 'oferta-activa')
            ->where('seats', '>', 0)
            ->whereHas('studentProfile', function ($query) use ($viewer): void {
                $query->where('verified', true)
                    ->where('status', 'activo')
                    ->where('user_id', '<>', $viewer->id)
                    ->whereHas('user', function ($userQuery): void {
                        $userQuery->where('status', User::STATUS_ACTIVE)
                            ->whereNotNull('email_verified_at');
                    });
            });
        $totalOffers = (clone $eligibleOffers)->count();
        $offers = $eligibleOffers
            ->with(['studentProfile:id,user_id,name,university,career,neighborhood,shift,transport'])
            ->latest()
            ->limit(200)
            ->get();

        $recommendations = $offers
            ->map(function (TravelOffer $offer) use ($profile): ?array {
                $candidate = $offer->studentProfile;
                $score = 0;
                $reasons = [];
                $viewerNeighborhood = $this->normalizeMatchValue($profile->neighborhood);
                $route = $this->normalizeMatchValue($offer->origin.' '.$offer->destination);

                $zonePattern = '~(?:^|[^a-z0-9])'.preg_quote($viewerNeighborhood, '~').'(?:$|[^a-z0-9])~';
                if (
                    strlen($viewerNeighborhood) >= 3 &&
                    preg_match($zonePattern, $route) === 1
                ) {
                    $score += 50;
                    $reasons[] = 'El recorrido pasa por tu zona declarada';
                }

                $validDepartureTime = preg_match(
                    '/^(?:[01]\d|2[0-3]):[0-5]\d$/',
                    (string) $offer->departure_time,
                ) === 1;
                $hour = (int) substr((string) $offer->departure_time, 0, 2);
                $shift = $this->normalizeMatchValue($profile->shift);
                $fitsShift = match (true) {
                    ! $validDepartureTime => false,
                    str_contains($shift, 'manana') => $hour >= 5 && $hour < 12,
                    str_contains($shift, 'tarde') => $hour >= 12 && $hour < 18,
                    str_contains($shift, 'noche'), str_contains($shift, 'noct') => $hour >= 18 || $hour < 5,
                    default => false,
                };
                if ($shift !== '' && $fitsShift) {
                    $score += 35;
                    $reasons[] = 'La salida coincide con tu jornada declarada';
                }

                $preferredTransport = $this->normalizeMatchValue($profile->transport);
                $offerTransport = $this->normalizeMatchValue($offer->mode);
                $preferredMode = trim((string) preg_split('~[+/,]~', $preferredTransport)[0]);
                if ($preferredMode !== '' && str_contains($offerTransport, $preferredMode)) {
                    $score += 15;
                    $reasons[] = 'Coincide con tu transporte preferido';
                }

                if ($score < 30) {
                    return null;
                }

                return [
                    'id' => $offer->id,
                    'traveler' => $candidate->name,
                    'origin' => $offer->origin,
                    'destination' => $offer->destination,
                    'zone' => $offer->origin.' → '.$offer->destination,
                    'time' => $offer->departure_time,
                    'mode' => $offer->mode,
                    'university' => $candidate->university,
                    'seats' => $offer->seats,
                    'cost' => $offer->cost,
                    'score' => $score,
                    'reasons' => $reasons,
                ];
            })
            ->filter()
            ->sortByDesc('score')
            ->values();

        return response()->json([
            'data' => $recommendations,
            'meta' => [
                'profile_available' => true,
                'evaluated' => $offers->count(),
                'total' => $totalOffers,
                'truncated' => $totalOffers > $offers->count(),
                'minimum_score' => 30,
            ],
        ]);
    }

    private function normalizeMatchValue(?string $value): string
    {
        return Str::lower(trim(Str::ascii($value ?? '')));
    }

    public function createAlert(Request $request)
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

        return response()->json([
            'message' => 'Alerta registrada para el equipo de seguridad.',
            'data' => $this->safetyAlertData($alert),
        ], 201);
    }

    public function securityAlerts(Request $request)
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

    public function resolveSafetyAlert(Request $request, SafetyAlert $alert)
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
            'data' => $this->safetyAlertData($resolvedAlert),
        ]);
    }

    private function safetyAlertData(SafetyAlert $alert): array
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

    public function dashboard()
    {
        $trustAverage = (float) (TrustLedger::avg('score_delta') ?? 0);

        return response()->json([
            'stats' => [
                'students' => StudentProfile::count(),
                'trips' => TravelOffer::count(),
                'matches' => TripMatch::count(),
                'alerts' => SafetyAlert::count(),
                'trust_score_avg' => round($trustAverage, 2),
            ],
            'recent_alerts' => SafetyAlert::latest()->limit(5)->get(),
            'recent_trips' => TravelOffer::latest()->limit(5)->get(),
        ]);
    }
}
