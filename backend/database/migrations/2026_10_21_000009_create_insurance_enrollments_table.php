<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('insurance_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('product_key', 80);
            $table->string('provider', 80);
            $table->string('product_name', 120);
            $table->unsignedInteger('monthly_premium_cop')->nullable();
            $table->text('coverage_summary')->nullable();
            $table->string('policy_number', 120)->nullable();
            $table->date('coverage_starts_at')->nullable();
            $table->date('coverage_ends_at')->nullable();
            $table->string('policy_document_path')->nullable();
            $table->string('status', 24)->default('quote_requested');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('review_note')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'status']);
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('insurance_enrollments');
    }
};
