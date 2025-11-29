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
        'peran',
        'status',
        'catatan',
        'available_dates',
        'approved_at',
    ];

    protected $casts = [
        'available_dates' => 'array',
        'approved_at' => 'datetime',
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
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    // Legacy scopes for backward compatibility
    public function scopeSetuju($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeDitolak($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeMenunggu($query)
    {
        return $query->where('status', 'pending');
    }

    // Helpers
    public function isApproved()
    {
        return $this->status === 'approved';
    }

    public function isRejected()
    {
        return $this->status === 'rejected';
    }

    public function isPending()
    {
        return $this->status === 'pending';
    }

    /**
     * Get formatted available dates for display
     */
    public function getFormattedAvailableDates(): ?array
    {
        if (!$this->available_dates) {
            return null;
        }

        return array_map(function ($date) {
            return \Carbon\Carbon::parse($date)->format('d M Y');
        }, $this->available_dates);
    }
}