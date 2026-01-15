<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class File extends Model
{
    protected $fillable = ['project_id', 'name', 'content', 'language'];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function scans(): HasMany
    {
        return $this->hasMany(Scan::class);
    }
}
