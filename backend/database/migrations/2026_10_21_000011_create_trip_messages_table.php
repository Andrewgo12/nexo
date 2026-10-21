<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trip_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('travel_offer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sender_profile_id')->constrained('student_profiles')->cascadeOnDelete();
            $table->text('body');
            $table->timestamps();
            $table->index(['travel_offer_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trip_messages');
    }
};
