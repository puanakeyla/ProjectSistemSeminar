<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SeminarApproval extends Model
{
    use HasFactory;

    protected $fillable = [
        'seminar_id',
        'dosen_id',
        'status',
        'alasan',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function seminar()
    {
        return $this->belongsTo(Seminar::class);
    }

    public function dosen()
    {
        return $this->belongsTo(User::class, 'dosen_id');
    }

    // Scopes
    public function scopeSetuju($query)
    {
        return $query->where('status', 'setuju');
    }

    public function scopeDitolak($query)
    {
        return $query->where('status', 'ditolak');
    }

    public function scopeMenunggu($query)
    {
        return $query->where('status', 'menunggu');
    }

    // Helpers
    public function isApproved()
    {
        return $this->status === 'setuju';
    }

    public function isRejected()
    {
        return $this->status === 'ditolak';
    }

    public function isPending()
    {
        return $this->status === 'menunggu';
    }
}