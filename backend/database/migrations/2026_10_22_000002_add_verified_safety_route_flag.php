<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('travel_offers', function (Blueprint $table): void {
            $table->boolean('safety_route_verified')->default(false)->after('safety_route');
        });
    }

    public function down(): void
    {
        Schema::table('travel_offers', function (Blueprint $table): void {
            $table->dropColumn('safety_route_verified');
        });
    }
};
