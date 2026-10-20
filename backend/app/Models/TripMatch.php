<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TripMatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_profile_id',
        'matched_student_id',
        'score',
        'zone',
        'time',
        'route',
        'status',
    ];
}
