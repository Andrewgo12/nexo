<?php

namespace App\Services;

use App\Models\SafetyAlert;
use App\Models\StudentProfile;
use App\Models\TravelOffer;
use App\Models\TripMatch;
use App\Models\TripRequest;
use App\Models\TripReview;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class DashboardAnalyticsService
{
    public function build(User $user): array
    {
        $isUniversityScoped = $user->role === User::ROLE_UNIVERSITY;
        $university = $user->university;
        $scopeProfiles = fn (Builder $query): Builder => $isUniversityScoped
            ? $query->where('university', $university ?? '')
            : $query;
        $profiles = $scopeProfiles(StudentProfile::query());
        $offers = TravelOffer::query()->whereHas('studentProfile', $scopeProfiles);
        $alerts = SafetyAlert::query()->whereHas('studentProfile', $scopeProfiles);
        $requests = TripRequest::query()->where(function (Builder $query) use ($offers, $profiles): void {
            $query->whereIn('travel_offer_id', (clone $offers)->select('id'))
                ->orWhereIn('requester_profile_id', (clone $profiles)->select('id'));
        });
        $matches = TripMatch::query()->where(function (Builder $query) use ($profiles): void {
            $query->whereIn('student_profile_id', (clone $profiles)->select('id'))
                ->orWhereIn('matched_student_id', (clone $profiles)->select('id'));
        });
        $registeredUsers = User::query()
            ->where('role', User::ROLE_STUDENT)
            ->when($isUniversityScoped, fn (Builder $query) => $query->where('university', $university ?? ''));
        $byUniversity = StudentProfile::query();
        if ($isUniversityScoped) {
            $byUniversity->where('university', $university ?? '');
        }

        $requestCounts = (clone $requests)
            ->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');
        $requestTotal = (int) $requestCounts->sum();
        $acceptedRequests = (int) ($requestCounts['accepted'] ?? 0);

        return [
            'stats' => [
                'students' => (clone $profiles)->count(),
                'registered_users' => $registeredUsers->count(),
                'trips' => (clone $offers)->count(),
                'active_trips' => (clone $offers)->whereIn('status', ['oferta-activa', 'en-curso'])->count(),
                'completed_trips' => (clone $offers)->where('status', 'completada')->count(),
                'matches' => $matches->count(),
                'alerts' => (clone $alerts)->count(),
                'active_alerts' => (clone $alerts)->where('active', true)->count(),
                'trip_requests' => $requestTotal,
                'accepted_requests' => $acceptedRequests,
                'request_acceptance_rate' => $requestTotal > 0
                    ? round($acceptedRequests / $requestTotal * 100, 1)
                    : null,
                'trust_score_avg' => TripReview::query()
                    ->whereIn('reviewee_profile_id', (clone $profiles)->select('id'))
                    ->avg('rating'),
            ],
            'scope' => [
                'university' => $isUniversityScoped ? $university : null,
                'global' => ! $isUniversityScoped,
            ],
            'distribution' => [
                'by_university' => $byUniversity
                    ->selectRaw('university as label, COUNT(*) as total')
                    ->groupBy('university')
                    ->orderByDesc('total')
                    ->limit(10)
                    ->get(),
                'by_neighborhood' => (clone $profiles)
                    ->selectRaw("COALESCE(NULLIF(TRIM(neighborhood), ''), 'Sin declarar') as label, COUNT(*) as total")
                    ->groupBy('label')
                    ->orderByDesc('total')
                    ->limit(10)
                    ->get(),
                'by_shift' => (clone $profiles)
                    ->selectRaw("COALESCE(NULLIF(TRIM(shift), ''), 'Sin declarar') as label, COUNT(*) as total")
                    ->groupBy('label')
                    ->orderByDesc('total')
                    ->limit(10)
                    ->get(),
            ],
            'recent_alerts' => (clone $alerts)
                ->latest()
                ->limit(5)
                ->get(['id', 'type', 'severity', 'active', 'created_at']),
            'recent_trips' => (clone $offers)
                ->latest()
                ->limit(5)
                ->get(['id', 'origin', 'destination', 'status', 'created_at']),
        ];
    }
}
