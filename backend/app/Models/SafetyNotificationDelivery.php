<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SafetyNotificationDelivery extends Model
{
    protected $fillable = [
        'trip_safety_event_id',
        'channel',
        'status',
        'recipient_hash',
        'provider_message_id',
        'failure_reason',
        'sent_at',
    ];

    protected function casts(): array
    {
        return ['sent_at' => 'datetime'];
    }

    public function event()
    {
        return $this->belongsTo(TripSafetyEvent::class, 'trip_safety_event_id');
    }
}
