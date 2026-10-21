<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TripMessage extends Model
{
    protected $fillable = [
        'travel_offer_id',
        'sender_profile_id',
        'body',
    ];

    public function senderProfile()
    {
        return $this->belongsTo(StudentProfile::class, 'sender_profile_id');
    }

    public function travelOffer()
    {
        return $this->belongsTo(TravelOffer::class);
    }
}
