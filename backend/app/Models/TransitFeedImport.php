<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransitFeedImport extends Model
{
    protected $fillable = [
        'feed_version',
        'status',
        'stops_count',
        'routes_count',
        'imported_by_user_id',
    ];

    public function stops()
    {
        return $this->hasMany(TransitStop::class);
    }

    public function routes()
    {
        return $this->hasMany(TransitRoute::class);
    }
}
