<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trip_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('travel_offer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('requester_profile_id')->constrained('student_profiles')->cascadeOnDelete();
            $table->string('status')->default('pending');
            $table->timestamps();
            $table->unique(['travel_offer_id', 'requester_profile_id']);
            $table->index(['travel_offer_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trip_requests');
    }
};
