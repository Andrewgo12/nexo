<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MembershipPayment extends Model
{
    protected $fillable = [
        'user_id',
        'provider',
        'reference',
        'amount_in_cents',
        'currency',
        'status',
        'gateway_transaction_id',
        'environment',
        'gateway_updated_at',
    ];

    protected function casts(): array
    {
        return [
            'amount_in_cents' => 'integer',
            'gateway_updated_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
