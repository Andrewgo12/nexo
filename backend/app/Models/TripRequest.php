<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TripRequest extends Model
{
    protected $fillable = [
        'travel_offer_id',
        'requester_profile_id',
        'status',
    ];

    public function travelOffer()
    {
        return $this->belongsTo(TravelOffer::class);
    }

    public function requesterProfile()
    {
        return $this->belongsTo(StudentProfile::class, 'requester_profile_id');
    }
}
