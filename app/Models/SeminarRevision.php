<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SeminarRevision extends Model
{
    use HasFactory;

    protected $fillable = [
        'seminar_id',
        'created_by_dosen',
        'file_revisi',
        'catatan_mahasiswa',
        'catatan_dosen',
        'catatan_admin',
        'status',
        'is_approved_by_dosen',
        'tanggal_pengumpulan',
        'tanggal_verifikasi',
    ];

    protected $casts = [
        'is_approved_by_dosen' => 'boolean',
        'tanggal_pengumpulan' => 'datetime',
        'tanggal_verifikasi' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function seminar()
    {
        return $this->belongsTo(Seminar::class);
    }

    public function items()
    {
        return $this->hasMany(SeminarRevisionItem::class, 'revision_id');
    }

    public function createdByDosen()
    {
        return $this->belongsTo(User::class, 'created_by_dosen');
    }

    // Get progress percentage
    public function getProgressPercentage(): int
    {
        $total = $this->items()->count();
        if ($total === 0) return 0;
        
        $approved = $this->items()->approved()->count();
        return round(($approved / $total) * 100);
    }

    // Check if all items are approved
    public function allItemsApproved(): bool
    {
        $total = $this->items()->count();
        if ($total === 0) return false;
        
        return $this->items()->approved()->count() === $total;
    }

    // Scopes
    public function scopeMenunggu($query)
    {
        return $query->where('status', 'submitted');
    }

    public function scopeDisetujui($query)
    {
        return $query->where('status', 'accepted');
    }

    public function scopeDitolak($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeRevisi($query)
    {
        return $query->where('status', 'reviewed');
    }

    // Helpers
    public function isPending()
    {
        return $this->status === 'submitted';
    }

    public function isApproved()
    {
        return $this->status === 'accepted';
    }

    public function isRejected()
    {
        return $this->status === 'rejected';
    }

    public function needsRevision()
    {
        return $this->status === 'reviewed';
    }

    public function getStatusDisplay(): string
    {
        return match ($this->status) {
            'submitted' => 'Menunggu Validasi',
            'accepted' => 'Disetujui',
            'rejected' => 'Ditolak',
            'reviewed' => 'Perlu Revisi',
            default => ucfirst($this->status ?? '-')
        };
    }

    public function getStatusColor()
    {
        return match($this->status) {
            'submitted' => 'yellow',
            'accepted' => 'green',
            'rejected' => 'red',
            'reviewed' => 'orange',
            default => 'gray'
        };
    }
}