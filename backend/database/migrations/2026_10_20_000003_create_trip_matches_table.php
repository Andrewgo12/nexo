<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trip_matches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_profile_id')->constrained('student_profiles')->cascadeOnDelete();
            $table->foreignId('matched_student_id')->constrained('student_profiles')->cascadeOnDelete();
            $table->decimal('score', 5, 2)->default(0);
            $table->string('zone')->nullable();
            $table->string('time')->nullable();
            $table->string('route')->nullable();
            $table->string('status')->default('sugerida');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trip_matches');
    }
};
