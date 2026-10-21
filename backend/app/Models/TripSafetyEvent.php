<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TripSafetyEvent extends Model
{
    protected $fillable = [
        'travel_offer_id',
        'safety_alert_id',
        'user_id',
        'type',
        'occurred_at',
    ];

    protected function casts(): array
    {
        return ['occurred_at' => 'datetime'];
    }

    public function deliveries()
    {
        return $this->hasMany(SafetyNotificationDelivery::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
