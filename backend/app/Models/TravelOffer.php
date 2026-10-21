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
}
