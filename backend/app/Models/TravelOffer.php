<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
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
        'departure_date',
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

    public function messages()
    {
        return $this->hasMany(TripMessage::class);
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

    public function scopeUpcoming(Builder $query): Builder
    {
        $now = now();

        return $query->where(function (Builder $query) use ($now): void {
            $query->whereDate('departure_date', '>', $now->toDateString())
                ->orWhere(function (Builder $query) use ($now): void {
                    $query->whereDate('departure_date', $now->toDateString())
                        ->where('departure_time', '>=', $now->format('H:i'));
                });
        });
    }

    public function isUpcoming(): bool
    {
        $departureDate = $this->departure_date;
        $now = now();

        return $departureDate !== null
            && (
                $departureDate->isAfter($now->copy()->startOfDay())
                || (
                    $departureDate->isSameDay($now)
                    && $this->departure_time >= $now->format('H:i')
                )
            );
    }

    protected function casts(): array
    {
        return [
            'departure_date' => 'date',
            'safety_route' => 'array',
            'safety_route_duration_minutes' => 'integer',
            'started_at' => 'datetime',
            'arrival_checkin_deadline_at' => 'datetime',
            'safety_geofence_consent_at' => 'datetime',
        ];
    }
}
