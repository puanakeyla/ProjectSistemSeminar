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
        'verification_history',
        'cancelled_at',
        'cancel_reason',
        'cancelled_by',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'verified_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'verification_history' => 'array',
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
            'cancelled', 'dibatalkan' => 'cancelled',
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

    public function cancelledBy()
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    public function approvals()
    {
        return $this->hasMany(SeminarApproval::class);
    }

    public function approvalHistories()
    {
        return $this->hasMany(ApprovalHistory::class);
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
            'scheduled' => 'Disetujui',
            'finished' => 'Selesai',
            'revising' => 'Revisi',
            'cancelled' => 'Dibatalkan',
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
            'cancelled' => 'red',
            default => 'gray'
        };
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
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

    /**
     * Check if all 3 dosen have approved their revisions
     * Used for final seminar approval after presentation
     * NEW LOGIC: Cek per dosen, apakah semua items yang dia buat sudah approved
     */
    public function areAllRevisionsApprovedByDosen(): bool
    {
        $dosenIds = [
            $this->pembimbing1_id,
            $this->pembimbing2_id,
            $this->penguji_id
        ];

        // Get the active revision for this seminar
        $revision = $this->revisions()->latest()->first();
        if (!$revision) {
            return false;
        }

        // Check each dosen: all their items must be approved
        foreach ($dosenIds as $dosenId) {
            $totalItems = $revision->items()->where('created_by', $dosenId)->count();

            // If dosen hasn't created any items, skip (they approved implicitly)
            if ($totalItems === 0) {
                continue;
            }

            $approvedItems = $revision->items()
                ->where('created_by', $dosenId)
                ->where('status', 'approved')
                ->count();

            // If this dosen has unapproved items, return false
            if ($approvedItems < $totalItems) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get revision approval status per dosen
     */
    public function getRevisionApprovalStatus(): array
    {
        $dosenIds = [
            'pembimbing1' => $this->pembimbing1_id,
            'pembimbing2' => $this->pembimbing2_id,
            'penguji' => $this->penguji_id,
        ];

        $revision = $this->revisions()->latest()->first();
        $status = [];

        foreach ($dosenIds as $role => $dosenId) {
            if (!$revision) {
                $status[$role] = [
                    'has_items' => false,
                    'all_approved' => false,
                    'total_items' => 0,
                    'approved_items' => 0,
                ];
                continue;
            }

            $totalItems = $revision->items()->where('created_by', $dosenId)->count();
            $approvedItems = $revision->items()
                ->where('created_by', $dosenId)
                ->where('status', 'approved')
                ->count();

            $status[$role] = [
                'has_items' => $totalItems > 0,
                'all_approved' => $totalItems > 0 && $approvedItems === $totalItems,
                'total_items' => $totalItems,
                'approved_items' => $approvedItems,
            ];
        }

        return $status;
    }

    /**
     * Get URL for seminar file
     */
    public function getFileUrl(): ?string
    {
        if (!$this->file_berkas) {
            return null;
        }

        return asset('storage/' . $this->file_berkas);
    }
}
