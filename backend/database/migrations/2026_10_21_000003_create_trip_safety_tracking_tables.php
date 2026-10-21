<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trip_locations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('travel_offer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->unsignedInteger('accuracy_meters')->nullable();
            $table->timestamp('captured_at');
            $table->timestamps();
            $table->unique(['travel_offer_id', 'user_id']);
            $table->index(['travel_offer_id', 'captured_at']);
        });

        Schema::create('trip_check_ins', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('travel_offer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->timestamp('checked_in_at');
            $table->timestamps();
            $table->unique(['travel_offer_id', 'user_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trip_check_ins');
        Schema::dropIfExists('trip_locations');
    }
};
