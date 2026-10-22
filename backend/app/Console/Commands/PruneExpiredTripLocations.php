<?php

namespace App\Console\Commands;

use App\Models\TripLocation;
use Illuminate\Console\Command;

class PruneExpiredTripLocations extends Command
{
    protected $signature = 'viajau:prune-trip-locations';

    protected $description = 'Elimina ubicaciones precisas vencidas de viajes.';

    public function handle(): int
    {
        $retentionHours = (int) config('viajau.safety.location_retention_hours');
        $deleted = TripLocation::query()
            ->where('captured_at', '<', now()->subHours($retentionHours))
            ->delete();

        $this->info("Se eliminaron {$deleted} ubicaciones vencidas.");

        return self::SUCCESS;
    }
}
