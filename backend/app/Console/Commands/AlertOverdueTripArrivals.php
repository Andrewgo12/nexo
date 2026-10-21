<?php

namespace App\Console\Commands;

use App\Models\TravelOffer;
use App\Services\SafetyNotificationService;
use Illuminate\Console\Command;

class AlertOverdueTripArrivals extends Command
{
    protected $signature = 'viajau:alert-overdue-arrivals';

    protected $description = 'Notifica check-ins de llegada vencidos en viajes activos.';

    public function handle(SafetyNotificationService $notifications): int
    {
        $trips = TravelOffer::query()
            ->where('status', 'en-curso')
            ->whereNotNull('arrival_checkin_deadline_at')
            ->where('arrival_checkin_deadline_at', '<=', now())
            ->with(['studentProfile.user', 'requests.requesterProfile.user'])
            ->get();

        foreach ($trips as $trip) {
            $users = collect([$trip->studentProfile->user])
                ->merge($trip->requests
                    ->where('status', 'accepted')
                    ->map(fn ($request) => $request->requesterProfile->user))
                ->filter()
                ->unique('id');

            foreach ($users as $user) {
                $hasArrivalCheckIn = $trip->checkIns()
                    ->where('user_id', $user->id)
                    ->where('type', 'arrival')
                    ->exists();
                if ($hasArrivalCheckIn) {
                    continue;
                }

                $notifications->trigger([
                    'travel_offer_id' => $trip->id,
                    'user_id' => $user->id,
                    'type' => 'arrival_checkin_overdue',
                ]);
            }
        }

        return self::SUCCESS;
    }
}
