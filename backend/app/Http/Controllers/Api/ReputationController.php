<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentProfile;
use App\Models\TravelOffer;
use App\Models\TripRequest;
use App\Models\TripReview;
use App\Models\User;
use App\Models\UserReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ReputationController extends Controller
{
    public function mine(Request $request)
    {
        $profile = $this->activeProfile($request);
        $reviews = TripReview::query()
            ->where('reviewee_profile_id', $profile->id);
        $completedOffers = TravelOffer::query()
            ->where('status', 'completada')
            ->where(function ($query) use ($profile): void {
                $query->where('student_profile_id', $profile->id)
                    ->orWhereHas('requests', fn ($requests) => $requests
                        ->where('requester_profile_id', $profile->id)
                        ->where('status', 'accepted'));
            })
            ->with([
                'studentProfile:id,name,university',
                'requests' => fn ($requests) => $requests->where('status', 'accepted')
                    ->with('requesterProfile:id,name,university'),
            ])
            ->latest()
            ->limit(100)
            ->get();
        $reviewedProfilesByTrip = TripReview::query()
            ->whereIn('travel_offer_id', $completedOffers->modelKeys())
            ->where('reviewer_profile_id', $profile->id)
            ->get(['travel_offer_id', 'reviewee_profile_id'])
            ->groupBy('travel_offer_id')
            ->map(fn ($reviews) => $reviews->pluck('reviewee_profile_id')->map(fn ($id) => (int) $id)->all());
        $completedTrips = $completedOffers
            ->map(function (TravelOffer $trip) use ($profile, $reviewedProfilesByTrip): array {
                $participants = collect([$trip->studentProfile])
                    ->merge($trip->requests->pluck('requesterProfile'))
                    ->filter()
                    ->unique('id')
                    ->reject(fn (StudentProfile $participant): bool => $participant->id === $profile->id)
                    ->map(function (StudentProfile $participant) use ($trip, $reviewedProfilesByTrip): array {
                        return [
                            'profile_id' => $participant->id,
                            'name' => $participant->name,
                            'university' => $participant->university,
                            'reviewed' => in_array(
                                $participant->id,
                                $reviewedProfilesByTrip->get($trip->id, []),
                                true,
                            ),
                        ];
                    })->values();

                return [
                    'trip_id' => $trip->id,
                    'route' => $trip->origin.' → '.$trip->destination,
                    'completed_at' => $trip->updated_at?->toISOString(),
                    'participants' => $participants,
                ];
            })
            ->values();
        $pendingTrips = $completedTrips
            ->filter(fn (array $trip): bool => $trip['participants']->contains(fn (array $participant): bool => ! $participant['reviewed']))
            ->values();
        $reportableTrips = TravelOffer::query()
            ->whereIn('status', ['en-curso', 'completada'])
            ->where(function ($query) use ($profile): void {
                $query->where('student_profile_id', $profile->id)
                    ->orWhereHas('requests', fn ($requests) => $requests
                        ->where('requester_profile_id', $profile->id)
                        ->where('status', 'accepted'));
            })
            ->with([
                'studentProfile:id,name,university',
                'requests' => fn ($requests) => $requests->where('status', 'accepted')
                    ->with('requesterProfile:id,name,university'),
            ])
            ->latest()
            ->limit(100)
            ->get()
            ->map(function (TravelOffer $trip) use ($profile): array {
                $participants = collect([$trip->studentProfile])
                    ->merge($trip->requests->pluck('requesterProfile'))
                    ->filter()
                    ->unique('id')
                    ->reject(fn (StudentProfile $participant): bool => $participant->id === $profile->id)
                    ->map(fn (StudentProfile $participant): array => [
                        'profile_id' => $participant->id,
                        'name' => $participant->name,
                        'university' => $participant->university,
                    ])
                    ->values();

                return [
                    'trip_id' => $trip->id,
                    'route' => $trip->origin.' → '.$trip->destination,
                    'status' => $trip->status,
                    'participants' => $participants,
                ];
            })
            ->filter(fn (array $trip): bool => $trip['participants']->isNotEmpty())
            ->values();

        return response()->json([
            'data' => [
                'summary' => [
                    'rating_average' => $reviews->count() ? round((float) $reviews->avg('rating'), 1) : null,
                    'rating_count' => $reviews->count(),
                    'completed_trips' => TravelOffer::query()
                        ->where('status', 'completada')
                        ->where(function ($query) use ($profile): void {
                            $query->where('student_profile_id', $profile->id)
                                ->orWhereHas('requests', fn ($requests) => $requests
                                    ->where('requester_profile_id', $profile->id)
                                    ->where('status', 'accepted'));
                        })->count(),
                ],
                'received_reviews' => $reviews->with('reviewerProfile:id,name,university')
                    ->latest()
                    ->limit(50)
                    ->get()
                    ->map(fn (TripReview $review): array => [
                        'id' => $review->id,
                        'rating' => $review->rating,
                        'comment' => $review->comment,
                        'reviewer' => $review->reviewerProfile?->name,
                        'university' => $review->reviewerProfile?->university,
                        'created_at' => $review->created_at?->toISOString(),
                    ]),
                'completed_trips' => $completedTrips,
                'pending_trips' => $pendingTrips,
                'reportable_trips' => $reportableTrips,
                'reports' => UserReport::query()
                    ->where('reporter_profile_id', $profile->id)
                    ->latest()
                    ->limit(50)
                    ->get(['id', 'category', 'status', 'resolution_note', 'created_at', 'resolved_at']),
            ],
        ]);
    }

    public function profile(StudentProfile $profile)
    {
        $reviews = TripReview::query()->where('reviewee_profile_id', $profile->id);

        return response()->json([
            'data' => [
                'profile_id' => $profile->id,
                'rating_average' => $reviews->count() ? round((float) $reviews->avg('rating'), 1) : null,
                'rating_count' => $reviews->count(),
                'completed_trips' => TravelOffer::query()
                    ->where('student_profile_id', $profile->id)
                    ->where('status', 'completada')
                    ->count()
                    + TripRequest::query()
                        ->where('requester_profile_id', $profile->id)
                        ->where('status', 'accepted')
                        ->whereHas('travelOffer', fn ($offers) => $offers->where('status', 'completada'))
                        ->count(),
            ],
        ]);
    }

    public function review(Request $request, TravelOffer $trip)
    {
        $profile = $this->activeProfile($request);
        abort_unless($trip->status === 'completada', 409, 'Solo puedes valorar un viaje completado.');
        $data = $request->validate([
            'reviewee_profile_id' => ['required', 'integer', 'different:'.(string) $profile->id],
            'rating' => ['required', 'integer', 'between:1,5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);
        $participantIds = $this->participantIds($trip);
        abort_unless(
            $participantIds->contains($profile->id) && $participantIds->contains((int) $data['reviewee_profile_id']),
            403,
            'Solo puedes valorar a otra persona que participó en este viaje.',
        );

        $review = DB::transaction(function () use ($trip, $profile, $data): TripReview {
            TravelOffer::query()->lockForUpdate()->findOrFail($trip->id);
            abort_if(TripReview::query()
                ->where('travel_offer_id', $trip->id)
                ->where('reviewer_profile_id', $profile->id)
                ->where('reviewee_profile_id', $data['reviewee_profile_id'])
                ->exists(), 409, 'Ya enviaste una valoración para esta persona y este viaje.');

            return TripReview::create([
                'travel_offer_id' => $trip->id,
                'reviewer_profile_id' => $profile->id,
                'reviewee_profile_id' => $data['reviewee_profile_id'],
                'rating' => $data['rating'],
                'comment' => $data['comment'] ?? null,
            ]);
        });

        return response()->json([
            'message' => 'Tu valoración fue registrada.',
            'data' => ['id' => $review->id, 'rating' => $review->rating],
        ], 201);
    }

    public function report(Request $request, TravelOffer $trip)
    {
        $profile = $this->activeProfile($request);
        abort_unless(in_array($trip->status, ['en-curso', 'completada'], true), 409, 'Los reportes requieren un viaje en curso o completado.');
        $data = $request->validate([
            'reported_profile_id' => ['required', 'integer', 'different:'.(string) $profile->id],
            'category' => ['required', Rule::in(['safety', 'harassment', 'no_show', 'conduct', 'other'])],
            'description' => ['required', 'string', 'min:10', 'max:1500'],
        ]);
        $participantIds = $this->participantIds($trip);
        abort_unless(
            $participantIds->contains($profile->id) && $participantIds->contains((int) $data['reported_profile_id']),
            403,
            'Solo puedes reportar a otra persona que participó en este viaje.',
        );
        $report = DB::transaction(function () use ($trip, $profile, $data): UserReport {
            TravelOffer::query()->lockForUpdate()->findOrFail($trip->id);
            abort_if(UserReport::query()
                ->where('travel_offer_id', $trip->id)
                ->where('reporter_profile_id', $profile->id)
                ->where('reported_profile_id', $data['reported_profile_id'])
                ->exists(), 409, 'Ya existe un reporte tuyo para esta persona en este viaje.');

            return UserReport::create([
                'travel_offer_id' => $trip->id,
                'reporter_profile_id' => $profile->id,
                'reported_profile_id' => $data['reported_profile_id'],
                'category' => $data['category'],
                'description' => $data['description'],
            ]);
        });

        return response()->json(['message' => 'Reporte recibido para revisión.', 'data' => ['id' => $report->id]], 201);
    }

    public function reports(Request $request)
    {
        $filters = $request->validate([
            'status' => ['sometimes', Rule::in(['open', 'reviewed', 'actioned', 'dismissed'])],
            'page' => ['sometimes', 'integer', 'min:1'],
        ]);
        $reports = UserReport::query()
            ->with([
                'reporterProfile:id,name,university',
                'reportedProfile:id,name,university',
                'travelOffer:id,origin,destination',
            ])
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->latest()
            ->paginate(25)
            ->through(fn (UserReport $report): array => [
                'id' => $report->id,
                'category' => $report->category,
                'description' => $report->description,
                'status' => $report->status,
                'resolution_note' => $report->resolution_note,
                'created_at' => $report->created_at?->toISOString(),
                'resolved_at' => $report->resolved_at?->toISOString(),
                'reporter' => $report->reporterProfile?->name,
                'reported' => $report->reportedProfile?->name,
                'route' => $report->travelOffer
                    ? $report->travelOffer->origin.' → '.$report->travelOffer->destination
                    : null,
            ]);

        return response()->json([
            'data' => $reports->items(),
            'meta' => ['current_page' => $reports->currentPage(), 'last_page' => $reports->lastPage(), 'total' => $reports->total()],
        ]);
    }

    public function moderateReport(Request $request, UserReport $report)
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['reviewed', 'actioned', 'dismissed'])],
            'resolution_note' => ['nullable', 'string', 'max:1000'],
        ]);
        $report->update([
            'status' => $data['status'],
            'resolution_note' => $data['resolution_note'] ?? null,
            'moderator_id' => $request->user()->id,
            'resolved_at' => $data['status'] === 'reviewed' ? null : now(),
        ]);

        return response()->json(['message' => 'Estado del reporte actualizado.', 'data' => ['id' => $report->id, 'status' => $report->status]]);
    }

    private function activeProfile(Request $request): StudentProfile
    {
        $user = $request->user();
        abort_unless(
            User::query()->whereKey($user->getAuthIdentifier())->value('status') === User::STATUS_ACTIVE,
            403,
            'La cuenta debe estar activa.',
        );
        $profile = $user->studentProfile;
        abort_unless($profile && $profile->verified && $profile->status === 'activo', 403, 'Necesitas un perfil verificado y activo.');

        return $profile;
    }

    private function participantIds(TravelOffer $trip)
    {
        return collect([$trip->student_profile_id])
            ->merge($trip->requests()->where('status', 'accepted')->pluck('requester_profile_id'))
            ->unique()
            ->values();
    }
}
