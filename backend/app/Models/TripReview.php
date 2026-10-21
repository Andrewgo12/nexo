<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TripReview extends Model
{
    protected $fillable = [
        'travel_offer_id',
        'reviewer_profile_id',
        'reviewee_profile_id',
        'rating',
        'comment',
    ];

    public function travelOffer()
    {
        return $this->belongsTo(TravelOffer::class);
    }

    public function reviewerProfile()
    {
        return $this->belongsTo(StudentProfile::class, 'reviewer_profile_id');
    }

    public function revieweeProfile()
    {
        return $this->belongsTo(StudentProfile::class, 'reviewee_profile_id');
    }
}
