<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('student_profiles')->update(['trust_score' => null]);

        Schema::table('student_profiles', function (Blueprint $table) {
            $table->decimal('trust_score', 4, 2)->nullable()->default(null)->change();
        });
    }

    public function down(): void
    {
        DB::table('student_profiles')
            ->whereNull('trust_score')
            ->update(['trust_score' => 4.80]);

        Schema::table('student_profiles', function (Blueprint $table) {
            $table->decimal('trust_score', 4, 2)->default(4.80)->nullable(false)->change();
        });
    }
};
