<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TravelOffer extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_profile_id',
        'origin',
        'destination',
        'mode',
        'departure_time',
        'seats',
        'cost',
        'status',
        'safety_route',
        'safety_route_duration_minutes',
        'safety_geofence_consent_at',
        'started_at',
        'arrival_checkin_deadline_at',
    ];

    public function studentProfile()
    {
        return $this->belongsTo(StudentProfile::class);
    }

    public function requests()
    {
        return $this->hasMany(TripRequest::class);
    }

    public function locations()
    {
        return $this->hasMany(TripLocation::class);
    }

    public function checkIns()
    {
        return $this->hasMany(TripCheckIn::class);
    }

    public function safetyEvents()
    {
        return $this->hasMany(TripSafetyEvent::class);
    }

    protected function casts(): array
    {
        return [
            'safety_route' => 'array',
            'safety_route_duration_minutes' => 'integer',
            'started_at' => 'datetime',
            'arrival_checkin_deadline_at' => 'datetime',
            'safety_geofence_consent_at' => 'datetime',
        ];
    }
}
