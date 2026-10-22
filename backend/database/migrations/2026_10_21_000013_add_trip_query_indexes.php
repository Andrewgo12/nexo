<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('travel_offers', function (Blueprint $table): void {
            $table->index(['status', 'departure_time'], 'travel_offers_status_departure_index');
            $table->index(['student_profile_id', 'created_at'], 'travel_offers_profile_created_index');
        });

        Schema::table('student_profiles', function (Blueprint $table): void {
            $table->index(['verified', 'status', 'user_id'], 'student_profiles_verified_status_user_index');
        });

        Schema::table('trip_requests', function (Blueprint $table): void {
            $table->index(
                ['requester_profile_id', 'status', 'created_at'],
                'trip_requests_requester_status_created_index',
            );
        });

        Schema::table('safety_alerts', function (Blueprint $table): void {
            $table->index(['active', 'created_at'], 'safety_alerts_active_created_index');
        });

        Schema::table('trip_messages', function (Blueprint $table): void {
            $table->index(['travel_offer_id', 'id'], 'trip_messages_offer_id_index');
        });
    }

    public function down(): void
    {
        Schema::table('trip_messages', function (Blueprint $table): void {
            $table->dropIndex('trip_messages_offer_id_index');
        });

        Schema::table('safety_alerts', function (Blueprint $table): void {
            $table->dropIndex('safety_alerts_active_created_index');
        });

        Schema::table('trip_requests', function (Blueprint $table): void {
            $table->dropIndex('trip_requests_requester_status_created_index');
        });

        Schema::table('student_profiles', function (Blueprint $table): void {
            $table->dropIndex('student_profiles_verified_status_user_index');
        });

        Schema::table('travel_offers', function (Blueprint $table): void {
            $table->dropIndex('travel_offers_status_departure_index');
            $table->dropIndex('travel_offers_profile_created_index');
        });
    }
};
