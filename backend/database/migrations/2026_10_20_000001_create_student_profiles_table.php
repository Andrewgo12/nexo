<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('university');
            $table->string('career')->nullable();
            $table->string('semester')->nullable();
            $table->string('shift')->nullable();
            $table->string('neighborhood')->nullable();
            $table->string('transport')->nullable();
            $table->string('emergency_contact')->nullable();
            $table->string('privacy')->nullable();
            $table->boolean('verified')->default(true);
            $table->decimal('trust_score', 4, 2)->default(4.80);
            $table->string('status')->default('activo');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_profiles');
    }
};
