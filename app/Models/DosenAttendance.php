<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DosenAttendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'seminar_schedule_id',
        'dosen_id',
        'role',
        'status',
        'alasan',
        'confirmed_at',
    ];

    protected $casts = [
        'confirmed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function schedule()
    {
        return $this->belongsTo(SeminarSchedule::class, 'seminar_schedule_id');
    }

    public function dosen()
    {
        return $this->belongsTo(User::class, 'dosen_id');
    }

    // Scopes
    public function scopeHadir($query)
    {
        return $query->where('status', 'hadir');
    }

    public function scopeTidakHadir($query)
    {
        return $query->where('status', 'tidak_hadir');
    }

    // Helpers
    public function getStatusDisplay(): string
    {
        return match($this->status) {
            'hadir' => 'Hadir',
            'tidak_hadir' => 'Tidak Hadir',
            default => ucfirst($this->status),
        };
    }

    public function getRoleDisplay(): string
    {
        return match($this->role) {
            'pembimbing1' => 'Pembimbing 1',
            'pembimbing2' => 'Pembimbing 2',
            'penguji' => 'Penguji',
            default => ucfirst($this->role),
        };
    }

    // Relationship untuk verifikator admin
    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    // Scope untuk filter verifikasi
    public function scopeUnverified($query)
    {
        return $query->where('is_verified_by_admin', false);
    }

    public function scopeVerified($query)
    {
        return $query->where('is_verified_by_admin', true);
    }
}
