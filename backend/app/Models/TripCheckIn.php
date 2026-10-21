<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TripCheckIn extends Model
{
    protected $fillable = [
        'travel_offer_id',
        'user_id',
        'type',
        'checked_in_at',
    ];

    protected function casts(): array
    {
        return [
            'checked_in_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
