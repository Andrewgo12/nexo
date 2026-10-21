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
        'latitude',
        'longitude',
        'accuracy_meters',
        'resolved_at',
        'resolved_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
            'latitude' => 'float',
            'longitude' => 'float',
            'accuracy_meters' => 'integer',
            'resolved_at' => 'datetime',
        ];
    }

    public function studentProfile()
    {
        return $this->belongsTo(StudentProfile::class);
    }
}
