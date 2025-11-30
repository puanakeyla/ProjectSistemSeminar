<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Seminar extends Model
{
    use HasFactory;

    protected $fillable = [
        'mahasiswa_id',
        'judul',
        'tipe',
        'pembimbing1_id',
        'pembimbing2_id',
        'penguji_id',
        'abstrak',
        'file_berkas',
        'status',
        'skor_total',
        'verified_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'verified_at' => 'datetime',
    ];

    public function setStatusAttribute($value)
    {
        $this->attributes['status'] = $this->normalizeStatus($value);
    }

    private function normalizeStatus($value)
    {
        if ($value === null) {
            return null;
        }

        $key = Str::lower(str_replace(' ', '_', $value));

        return match ($key) {
            'pending', 'menunggu', 'pending_verification' => 'pending_verification',
            'approved', 'disetujui' => 'approved',
            'scheduled', 'terjadwal' => 'scheduled',
            'finished', 'selesai', 'completed' => 'finished',
            'revising', 'revisi', 'revision' => 'revising',
            'draft' => 'draft',
            default => $value,
        };
    }

    // Relationships
    public function mahasiswa()
    {
        return $this->belongsTo(User::class, 'mahasiswa_id');
    }

    public function pembimbing1()
    {
        return $this->belongsTo(User::class, 'pembimbing1_id');
    }

    public function pembimbing2()
    {
        return $this->belongsTo(User::class, 'pembimbing2_id');
    }

    public function penguji()
    {
        return $this->belongsTo(User::class, 'penguji_id');
    }

    public function approvals()
    {
        return $this->hasMany(SeminarApproval::class);
    }

    public function schedule()
    {
        return $this->hasOne(SeminarSchedule::class);
    }

    public function revisions()
    {
        return $this->hasMany(SeminarRevision::class);
    }

    public function attendances()
    {
        return $this->hasMany(SeminarAttendance::class);
    }

    // Query Scopes
    public function scopeMenunggu($query)
    {
        return $query->where('status', 'pending_verification');
    }

    public function scopeDisetujui($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeDitolak($query)
    {
        return $query->where('status', 'revising');
    }

    // Helpers / Presenters
    public function getJenisSeminarDisplay(): string
    {
        return match ($this->tipe) {
            'proposal' => 'Seminar Proposal',
            'hasil' => 'Seminar Hasil',
            'kompre' => 'Komprehensif',
            default => ucfirst($this->tipe ?? '-')
        };
    }

    public function getStatusDisplay(): string
    {
        return match ($this->status) {
            'draft' => 'Draft',
            'pending_verification' => 'Menunggu Verifikasi',
            'approved' => 'Disetujui',
            'scheduled' => 'Terjadwal',
            'finished' => 'Selesai',
            'revising' => 'Revisi',
            default => ucfirst($this->status ?? '-')
        };
    }

    public function getStatusColor(): string
    {
        return match ($this->status) {
            'draft' => 'gray',
            'pending_verification' => 'yellow',
            'approved' => 'green',
            'scheduled' => 'blue',
            'finished' => 'emerald',
            'revising' => 'orange',
            default => 'gray'
        };
    }

    /**
     * Get approval status metadata for a specific dosen (or the first approval if not specified).
     */
    public function getApprovalStatus(?int $dosenId = null): array
    {
        $approvals = $this->relationLoaded('approvals') ? $this->approvals : $this->approvals()->get();

        $approval = $dosenId
            ? $approvals->firstWhere('dosen_id', $dosenId)
            : $approvals->first();

        if (!$approval) {
            return [
                'status' => 'pending',
                'status_display' => 'Menunggu Persetujuan',
                'status_color' => 'yellow',
                'dosen_id' => $dosenId,
                'peran' => null,
                'updated_at' => null,
            ];
        }

        return [
            'status' => $approval->status,
            'status_display' => $approval->getStatusDisplay(),
            'status_color' => $approval->getStatusColor(),
            'dosen_id' => $approval->dosen_id,
            'peran' => $approval->peran,
            'updated_at' => $approval->updated_at?->toIso8601String(),
        ];
    }

    /** Determine whether all assigned dosen have approved the seminar. */
    public function isApprovedByAllDosen(): bool
    {
        $approvals = $this->relationLoaded('approvals') ? $this->approvals : $this->approvals()->get();

        if ($approvals->isEmpty()) {
            return false;
        }

        return $approvals->every(fn ($approval) => $approval->status === 'approved');
    }
}