<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('membership_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 24);
            $table->string('reference', 80)->unique();
            $table->unsignedInteger('amount_in_cents');
            $table->string('currency', 3)->default('COP');
            $table->string('status', 24)->default('pending');
            $table->string('gateway_transaction_id', 120)->nullable()->unique();
            $table->string('environment', 16)->default('sandbox');
            $table->timestamp('gateway_updated_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'created_at']);
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('membership_payments');
    }
};
