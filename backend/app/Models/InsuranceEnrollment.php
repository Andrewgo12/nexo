<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InsuranceEnrollment extends Model
{
    protected $fillable = [
        'user_id',
        'product_key',
        'provider',
        'product_name',
        'monthly_premium_cop',
        'coverage_summary',
        'policy_number',
        'coverage_starts_at',
        'coverage_ends_at',
        'policy_document_path',
        'status',
        'reviewed_by',
        'review_note',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'monthly_premium_cop' => 'integer',
            'coverage_starts_at' => 'date',
            'coverage_ends_at' => 'date',
            'reviewed_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
