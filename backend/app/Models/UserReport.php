<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserReport extends Model
{
    protected $fillable = [
        'travel_offer_id',
        'reporter_profile_id',
        'reported_profile_id',
        'category',
        'description',
        'status',
        'moderator_id',
        'resolution_note',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return ['resolved_at' => 'datetime'];
    }

    public function travelOffer()
    {
        return $this->belongsTo(TravelOffer::class);
    }

    public function reporterProfile()
    {
        return $this->belongsTo(StudentProfile::class, 'reporter_profile_id');
    }

    public function reportedProfile()
    {
        return $this->belongsTo(StudentProfile::class, 'reported_profile_id');
    }

    public function moderator()
    {
        return $this->belongsTo(User::class, 'moderator_id');
    }
}
