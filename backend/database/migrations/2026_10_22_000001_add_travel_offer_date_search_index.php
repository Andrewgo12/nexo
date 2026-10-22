<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('travel_offers', function (Blueprint $table): void {
            $table->index(
                ['status', 'departure_date', 'departure_time'],
                'travel_offers_status_date_time_index',
            );
        });
    }

    public function down(): void
    {
        Schema::table('travel_offers', function (Blueprint $table): void {
            $table->dropIndex('travel_offers_status_date_time_index');
        });
    }
};
