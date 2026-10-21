<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('trusted_contact_email')->nullable();
            $table->string('trusted_contact_phone', 16)->nullable();
            $table->boolean('trusted_contact_consent')->default(false);
            $table->timestamp('trusted_contact_consent_at')->nullable();
        });

        Schema::table('travel_offers', function (Blueprint $table) {
            $table->json('safety_route')->nullable();
            $table->unsignedSmallInteger('safety_route_duration_minutes')->nullable();
            $table->timestamp('safety_geofence_consent_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('arrival_checkin_deadline_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('travel_offers', function (Blueprint $table) {
            $table->dropColumn([
                'safety_route',
                'safety_route_duration_minutes',
                'safety_geofence_consent_at',
                'started_at',
                'arrival_checkin_deadline_at',
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'trusted_contact_email',
                'trusted_contact_phone',
                'trusted_contact_consent',
                'trusted_contact_consent_at',
            ]);
        });
    }
};
