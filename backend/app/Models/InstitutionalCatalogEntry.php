<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InstitutionalCatalogEntry extends Model
{
    protected $fillable = ['university', 'type', 'name', 'active'];

    protected function casts(): array
    {
        return ['active' => 'boolean'];
    }
}
