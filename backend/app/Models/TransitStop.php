<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransitStop extends Model
{
    protected $fillable = [
        'transit_feed_import_id',
        'stop_id',
        'stop_name',
        'stop_lat',
        'stop_lon',
    ];
}
