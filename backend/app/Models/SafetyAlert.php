<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SafetyAlert extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_profile_id',
        'type',
        'severity',
        'message',
        'active',
        'location',
    ];
}
