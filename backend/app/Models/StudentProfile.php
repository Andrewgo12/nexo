<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'email',
        'university',
        'career',
        'semester',
        'shift',
        'neighborhood',
        'transport',
        'emergency_contact',
        'privacy',
        'verified',
        'trust_score',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
