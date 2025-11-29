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
        return $query->where('status', 'menunggu');
    }

    public function scopeDisetujui($query)
    {
        return $query->where('status', 'disetujui');
    }

    public function scopeDitolak($query)
    {
        return $query->where('status', 'ditolak');
    }

    public function scopeRevisi($query)
    {
        return $query->where('status', 'revisi');
    }

    // Helpers
    public function isPending()
    {
        return $this->status === 'menunggu';
    }

    public function isApproved()
    {
        return $this->status === 'disetujui';
    }

    public function isRejected()
    {
        return $this->status === 'ditolak';
    }

    public function needsRevision()
    {
        return $this->status === 'revisi';
    }

    public function getStatusColor()
    {
        return match($this->status) {
            'menunggu' => 'yellow',
            'disetujui' => 'green',
            'ditolak' => 'red',
            'revisi' => 'orange',
            default => 'gray'
        };
    }
}