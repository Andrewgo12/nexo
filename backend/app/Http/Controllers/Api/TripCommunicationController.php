<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentProfile;
use App\Models\TravelOffer;
use App\Models\TripMessage;
use App\Models\TripRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TripCommunicationController extends Controller
{
    public function trips(Request $request)
    {
        $profile = $this->activeStudentProfile($request);
        $offers = TravelOffer::query()
            ->where(function ($query) use ($profile): void {
                $query->where(function ($ownerQuery) use ($profile): void {
                    $ownerQuery->where('student_profile_id', $profile->id)
                        ->whereHas('requests', fn ($requests) => $requests->where('status', 'accepted'));
                })
                    ->orWhereHas('requests', fn ($requests) => $requests
                        ->where('requester_profile_id', $profile->id)
                        ->where('status', 'accepted'));
            })
            ->with([
                'studentProfile:id,name,university',
                'requests' => fn ($query) => $query
                    ->where('status', 'accepted')
                    ->with('requesterProfile:id,name,university'),
            ])
            ->withCount('messages')
            ->withMax('messages', 'created_at')
            ->latest()
            ->limit(100)
            ->get()
            ->map(fn (TravelOffer $offer): array => [
                'id' => $offer->id,
                'origin' => $offer->origin,
                'destination' => $offer->destination,
                'departure_date' => $offer->departure_date?->toDateString(),
                'departure_time' => $offer->departure_time,
                'status' => $offer->status,
                'message_count' => $offer->messages_count,
                'last_message_at' => $offer->messages_max_created_at,
                'participants' => collect([$offer->studentProfile, ...$offer->requests->pluck('requesterProfile')])
                    ->filter()
                    ->unique('id')
                    ->map(fn (StudentProfile $participant): array => [
                        'id' => $participant->id,
                        'name' => $participant->name,
                    ])
                    ->values(),
            ])
            ->values();

        return response()->json(['data' => $offers]);
    }

    public function messages(Request $request, TravelOffer $trip)
    {
        $filters = $request->validate([
            'since_id' => ['sometimes', 'integer', 'min:0', 'prohibits:before_id'],
            'before_id' => ['sometimes', 'integer', 'min:1', 'prohibits:since_id'],
        ]);
        $profile = $this->activeStudentProfile($request);
        $this->assertParticipant($trip, $profile);
        $isIncremental = array_key_exists('since_id', $filters);
        $isHistoryPage = array_key_exists('before_id', $filters);

        $query = TripMessage::query()
            ->where('travel_offer_id', $trip->id)
            ->with('senderProfile:id,name')
            ->when($isIncremental, fn ($messages) => $messages->where('trip_messages.id', '>', $filters['since_id']))
            ->when($isHistoryPage, fn ($messages) => $messages->where('trip_messages.id', '<', $filters['before_id']))
            ->orderBy('trip_messages.id', $isIncremental ? 'asc' : 'desc')
            ->limit($isIncremental ? 100 : 101);
        $messages = $query->get();
        $hasOlderMessages = ! $isIncremental && $messages->count() > 100;
        if ($hasOlderMessages) {
            $messages = $messages->take(100);
        }
        if (! $isIncremental) {
            $messages = $messages->reverse()->values();
        }

        $messages = $messages
            ->map(fn (TripMessage $message): array => [
                'id' => $message->id,
                'sender_profile_id' => $message->sender_profile_id,
                'sender_name' => $message->senderProfile->name,
                'body' => $message->body,
                'created_at' => $message->created_at?->toISOString(),
                'is_mine' => (int) $message->sender_profile_id === (int) $profile->id,
            ]);

        return response()->json([
            'data' => $messages,
            'meta' => [
                'limit' => 100,
                'has_older' => $hasOlderMessages,
                'read_only' => ! in_array($trip->status, ['oferta-activa', 'en-curso'], true),
            ],
        ])->header('Cache-Control', 'no-store, private')
            ->header('Pragma', 'no-cache');
    }

    public function sendMessage(Request $request, TravelOffer $trip)
    {
        $profile = $this->activeStudentProfile($request);
        $this->assertParticipant($trip, $profile);
        abort_unless(
            in_array($trip->status, ['oferta-activa', 'en-curso'], true),
            409,
            'El chat queda en modo de solo lectura cuando el viaje se cierra.',
        );
        $data = $request->validate([
            'body' => ['required', 'string', 'min:1', 'max:2000'],
        ]);
        $body = trim($data['body']);
        abort_if($body === '', 422, 'El mensaje no puede estar vacío.');

        $message = DB::transaction(function () use ($profile, $trip, $body): TripMessage {
            $lockedTrip = TravelOffer::query()->lockForUpdate()->findOrFail($trip->id);
            abort_unless(
                in_array($lockedTrip->status, ['oferta-activa', 'en-curso'], true),
                409,
                'El chat queda en modo de solo lectura cuando el viaje se cierra.',
            );
            $this->assertParticipant($lockedTrip, $profile);

            return TripMessage::create([
                'travel_offer_id' => $lockedTrip->id,
                'sender_profile_id' => $profile->id,
                'body' => $body,
            ]);
        });
        $message->load('senderProfile:id,name');

        return response()->json([
            'message' => 'Mensaje enviado.',
            'data' => [
                'id' => $message->id,
                'sender_profile_id' => $message->sender_profile_id,
                'sender_name' => $message->senderProfile->name,
                'body' => $message->body,
                'created_at' => $message->created_at?->toISOString(),
                'is_mine' => true,
            ],
        ], 201)->header('Cache-Control', 'no-store, private')
            ->header('Pragma', 'no-cache');
    }

    private function activeStudentProfile(Request $request): StudentProfile
    {
        $user = $request->user();
        abort_unless($user->role === User::ROLE_STUDENT && $user->status === User::STATUS_ACTIVE, 403);
        $profile = $user->studentProfile;
        abort_unless(
            $profile && $profile->verified && $profile->status === 'activo',
            403,
            'Necesitas un perfil estudiantil activo y verificado para usar el chat.',
        );

        return $profile;
    }

    private function assertParticipant(TravelOffer $trip, StudentProfile $profile): void
    {
        $isOwner = (int) $trip->student_profile_id === (int) $profile->id;
        $isAcceptedPassenger = TripRequest::query()
            ->where('travel_offer_id', $trip->id)
            ->where('requester_profile_id', $profile->id)
            ->where('status', 'accepted')
            ->exists();
        abort_unless($isOwner || $isAcceptedPassenger, 404, 'No tienes acceso al chat de este viaje.');
    }
}
