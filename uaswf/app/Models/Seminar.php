<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Seminar extends Model
{
    use HasFactory;

    protected $fillable = [
        'mahasiswa_id',
        'judul',
        'jenis_seminar',
        'pembimbing1_id',
        'pembimbing2_id',
        'penguji_id',
        'file_persyaratan',
        'status',
        'alasan_ditolak',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

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

    // Helpers
    public function getAllDosenIds()
    {
        return [
            $this->pembimbing1_id,
            $this->pembimbing2_id,
            $this->penguji_id
        ];
    }

    public function isApprovedByAllDosen()
    {
        return $this->approvals()->where('status', 'setuju')->count() === 3;
    }

    public function getApprovalStatus($dosenId)
    {
        $approval = $this->approvals()->where('dosen_id', $dosenId)->first();
        return $approval ? $approval->status : 'menunggu';
    }
}