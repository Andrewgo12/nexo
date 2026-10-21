<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trip_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('travel_offer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('reviewer_profile_id')->constrained('student_profiles')->cascadeOnDelete();
            $table->foreignId('reviewee_profile_id')->constrained('student_profiles')->cascadeOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->text('comment')->nullable();
            $table->timestamps();
            $table->unique(['travel_offer_id', 'reviewer_profile_id', 'reviewee_profile_id']);
            $table->index(['reviewee_profile_id', 'created_at']);
        });

        Schema::create('user_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('travel_offer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('reporter_profile_id')->constrained('student_profiles')->cascadeOnDelete();
            $table->foreignId('reported_profile_id')->constrained('student_profiles')->cascadeOnDelete();
            $table->string('category', 32);
            $table->text('description');
            $table->string('status', 24)->default('open');
            $table->foreignId('moderator_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('resolution_note')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            $table->unique(['travel_offer_id', 'reporter_profile_id', 'reported_profile_id']);
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_reports');
        Schema::dropIfExists('trip_reviews');
    }
};
