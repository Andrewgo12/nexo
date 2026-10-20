<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrustLedger extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_profile_id',
        'event_name',
        'score_delta',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];
}
