<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('travel_offers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_profile_id')->constrained('student_profiles')->cascadeOnDelete();
            $table->string('origin');
            $table->string('destination');
            $table->string('mode')->default('MIO + caminata');
            $table->string('departure_time')->default('19:45');
            $table->integer('seats')->default(2);
            $table->string('cost')->default('2500 COP');
            $table->string('status')->default('oferta-activa');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('travel_offers');
    }
};
