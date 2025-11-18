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
}