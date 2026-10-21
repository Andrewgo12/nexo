<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('institutional_catalog_entries', function (Blueprint $table) {
            $table->id();
            $table->string('university');
            $table->string('type', 30);
            $table->string('name', 120);
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->unique(['university', 'type', 'name']);
            $table->index(['university', 'type', 'active']);
        });

        Schema::create('transit_feed_imports', function (Blueprint $table) {
            $table->id();
            $table->string('feed_version', 120);
            $table->string('status', 20);
            $table->unsignedInteger('stops_count')->default(0);
            $table->unsignedInteger('routes_count')->default(0);
            $table->foreignId('imported_by_user_id')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        Schema::create('transit_stops', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transit_feed_import_id')->constrained()->cascadeOnDelete();
            $table->string('stop_id', 120);
            $table->string('stop_name', 255);
            $table->decimal('stop_lat', 10, 7);
            $table->decimal('stop_lon', 10, 7);
            $table->timestamps();
            $table->unique(['transit_feed_import_id', 'stop_id']);
        });

        Schema::create('transit_routes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transit_feed_import_id')->constrained()->cascadeOnDelete();
            $table->string('route_id', 120);
            $table->string('route_short_name', 120)->nullable();
            $table->string('route_long_name', 255)->nullable();
            $table->timestamps();
            $table->unique(['transit_feed_import_id', 'route_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transit_routes');
        Schema::dropIfExists('transit_stops');
        Schema::dropIfExists('transit_feed_imports');
        Schema::dropIfExists('institutional_catalog_entries');
    }
};
