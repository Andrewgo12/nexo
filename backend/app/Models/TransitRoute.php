<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransitRoute extends Model
{
    protected $fillable = [
        'transit_feed_import_id',
        'route_id',
        'route_short_name',
        'route_long_name',
    ];
}
