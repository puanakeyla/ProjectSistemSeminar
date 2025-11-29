<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SeminarRevision extends Model
{
    use HasFactory;

    protected $fillable = [
        'seminar_id',
        'file_revisi',
        'catatan_mahasiswa',
        'catatan_dosen',
        'catatan_admin',
        'status',
        'tanggal_pengumpulan',
        'tanggal_verifikasi',
    ];

    protected $casts = [
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