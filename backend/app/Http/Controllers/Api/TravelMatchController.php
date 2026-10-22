<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TravelOffer;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TravelMatchController extends Controller
{
    public function index(Request $request)
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
}
