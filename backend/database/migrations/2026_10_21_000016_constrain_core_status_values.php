<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const STATUS_COLUMNS = [
        'users' => [
            'values' => ['active', 'pending', 'blocked'],
            'default' => 'active',
        ],
        'travel_offers' => [
            'values' => ['oferta-activa', 'en-curso', 'completada', 'cancelada'],
            'default' => 'oferta-activa',
        ],
        'trip_requests' => [
            'values' => ['pending', 'accepted', 'rejected', 'cancelled'],
            'default' => 'pending',
        ],
        'insurance_enrollments' => [
            'values' => ['quote_requested', 'quoted', 'pending_review', 'active', 'rejected'],
            'default' => 'quote_requested',
        ],
        'membership_payments' => [
            'values' => ['pending', 'approved', 'declined', 'voided', 'error'],
            'default' => 'pending',
        ],
    ];

    public function up(): void
    {
        foreach (self::STATUS_COLUMNS as $tableName => $definition) {
            $invalidStatuses = DB::table($tableName)
                ->whereNotIn('status', $definition['values'])
                ->distinct()
                ->pluck('status')
                ->all();

            if ($invalidStatuses !== []) {
                throw new RuntimeException(sprintf(
                    'Cannot constrain %s.status; unsupported existing values: %s.',
                    $tableName,
                    implode(', ', array_map(
                        static fn (mixed $status): string => $status === null ? 'NULL' : (string) $status,
                        $invalidStatuses,
                    )),
                ));
            }
        }

        foreach (self::STATUS_COLUMNS as $tableName => $definition) {
            Schema::table($tableName, function (Blueprint $table) use ($definition): void {
                $table->enum('status', $definition['values'])
                    ->default($definition['default'])
                    ->change();
            });
        }
    }

    public function down(): void
    {
        foreach (self::STATUS_COLUMNS as $tableName => $definition) {
            Schema::table($tableName, function (Blueprint $table) use ($definition): void {
                $table->string('status')
                    ->default($definition['default'])
                    ->change();
            });
        }
    }
};
