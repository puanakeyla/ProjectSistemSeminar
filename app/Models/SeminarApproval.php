<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

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

    public function getStatusDisplay(): string
    {
        return match ($this->status) {
            'pending' => 'Menunggu Persetujuan',
            'approved' => 'Disetujui',
            'rejected' => 'Ditolak',
            default => ucfirst($this->status ?? '-'),
        };
    }

    public function getStatusColor(): string
    {
        return match ($this->status) {
            'pending' => 'yellow',
            'approved' => 'green',
            'rejected' => 'red',
            default => 'gray',
        };
    }

    public function setPeranAttribute($value)
    {
        $this->attributes['peran'] = $this->normalizePeran($value);
    }

    public function setStatusAttribute($value)
    {
        $this->attributes['status'] = $this->normalizeStatus($value);
    }

    private function normalizePeran($value)
    {
        if ($value === null) {
            return null;
        }

        $key = Str::lower(str_replace([' ', '-'], '', $value));

        return match ($key) {
            'pembimbing1', 'pembimbing_1' => 'pembimbing1',
            'pembimbing2', 'pembimbing_2' => 'pembimbing2',
            'penguji' => 'penguji',
            default => $value,
        };
    }

    private function normalizeStatus($value)
    {
        if ($value === null) {
            return null;
        }

        $key = Str::lower(str_replace(' ', '_', $value));

        return match ($key) {
            'pending', 'pending_verification', 'pendingapproval', 'pending_approval' => 'pending',
            'approved', 'approved_by_admin', 'disetujui', 'setuju' => 'approved',
            'rejected', 'ditolak', 'revising', 'revision', 'needs_revision', 'reviewed' => 'rejected',
            default => $value,
        };
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