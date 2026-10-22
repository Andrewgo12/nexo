<?php

namespace App\Services;

use App\Models\TravelOffer;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TravelOfferSearchService
{
    private const RESULT_LIMIT = 100;

    public function search(int $viewerId, array $filters): array
    {
        $query = $this->eligibleOffers($viewerId)
            ->when($filters['zone'] ?? null, function (Builder $query, string $zone): void {
                $query->where(function (Builder $routeQuery) use ($zone): void {
                    $routeQuery->where('origin', 'like', '%'.$zone.'%')
                        ->orWhere('destination', 'like', '%'.$zone.'%');
                });
            })
            ->when($filters['time'] ?? null, function (Builder $query, string $time): void {
                $query->where('departure_time', 'like', substr($time, 0, 2).':%');
            })
            ->when($filters['transport'] ?? null, function (Builder $query, string $transport): void {
                $query->where('mode', 'like', '%'.$transport.'%');
            })
            ->when($filters['faculty'] ?? null, function (Builder $query, string $faculty): void {
                $query->whereHas('studentProfile', fn (Builder $profileQuery) => $profileQuery
                    ->where('career', 'like', '%'.$faculty.'%'));
            })
            ->when($filters['university'] ?? null, function (Builder $query, string $university): void {
                $query->whereHas('studentProfile', fn (Builder $profileQuery) => $profileQuery
                    ->where('university', 'like', '%'.$university.'%'));
            });

        $total = (clone $query)->count();
        $afterId = (int) ($filters['after_id'] ?? 0);
        $offers = (clone $query)
            ->when($afterId > 0, fn (Builder $pageQuery) => $pageQuery->where('id', '>', $afterId))
            ->orderBy('id')
            ->limit(self::RESULT_LIMIT)
            ->get()
            ->map(fn (TravelOffer $offer): array => [
                'id' => $offer->id,
                'name' => $offer->studentProfile->name,
                'profile_id' => $offer->studentProfile->id,
                'rating_average' => $offer->studentProfile->reviews_received_avg_rating
                    ? round((float) $offer->studentProfile->reviews_received_avg_rating, 1)
                    : null,
                'rating_count' => $offer->studentProfile->reviews_received_count,
                'origin' => $offer->origin,
                'destination' => $offer->destination,
                'departure_date' => $offer->departure_date?->toDateString(),
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
        $lastOfferId = $offers->last()['id'] ?? null;
        $hasMore = $lastOfferId !== null
            && (clone $query)->where('id', '>', $lastOfferId)->exists();

        return [
            'data' => $offers,
            'meta' => [
                'total' => $total,
                'limit' => self::RESULT_LIMIT,
                'truncated' => $hasMore,
                'next_after_id' => $hasMore ? $lastOfferId : null,
            ],
        ];
    }

    private function eligibleOffers(int $viewerId): Builder
    {
        return TravelOffer::query()
            ->upcoming()
            ->with(['studentProfile' => function (BelongsTo $profileQuery): void {
                $profileQuery->select(['id', 'user_id', 'name', 'university', 'career'])
                    ->withAvg('reviewsReceived', 'rating')
                    ->withCount('reviewsReceived');
            }])
            ->where('status', 'oferta-activa')
            ->where('seats', '>', 0)
            ->whereHas('studentProfile', function (Builder $profileQuery) use ($viewerId): void {
                $profileQuery->where('verified', true)
                    ->where('status', 'activo')
                    ->where('user_id', '<>', $viewerId)
                    ->whereHas('user', function (Builder $userQuery): void {
                        $userQuery->where('status', User::STATUS_ACTIVE)
                            ->whereNotNull('email_verified_at');
                    });
            });
    }
}
