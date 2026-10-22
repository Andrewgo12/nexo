<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('travel_offers', function (Blueprint $table) {
            $table->date('departure_date')->nullable()->after('departure_time');
        });
    }

    public function down(): void
    {
        Schema::table('travel_offers', function (Blueprint $table) {
            $table->dropColumn('departure_date');
        });
    }
};
