<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trip_safety_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('travel_offer_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('safety_alert_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 40);
            $table->timestamp('occurred_at');
            $table->timestamps();
            $table->unique(['travel_offer_id', 'user_id', 'type']);
            $table->unique('safety_alert_id');
        });

        Schema::create('safety_notification_deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trip_safety_event_id')->constrained()->cascadeOnDelete();
            $table->string('channel', 20);
            $table->string('status', 20);
            $table->char('recipient_hash', 64)->nullable();
            $table->string('provider_message_id')->nullable();
            $table->text('failure_reason')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
            $table->unique(['trip_safety_event_id', 'channel']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('safety_notification_deliveries');
        Schema::dropIfExists('trip_safety_events');
    }
};
