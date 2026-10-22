<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $duplicateUserId = DB::table('student_profiles')
            ->select('user_id')
            ->whereNotNull('user_id')
            ->groupBy('user_id')
            ->havingRaw('COUNT(*) > 1')
            ->value('user_id');

        if ($duplicateUserId !== null) {
            throw new RuntimeException(
                "Cannot enforce one profile per user: duplicate student_profiles.user_id {$duplicateUserId}.",
            );
        }

        Schema::table('student_profiles', function (Blueprint $table): void {
            $table->unique('user_id', 'student_profiles_user_id_unique');
        });
    }

    public function down(): void
    {
        Schema::table('student_profiles', function (Blueprint $table): void {
            $table->dropUnique('student_profiles_user_id_unique');
        });
    }
};
