<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SeminarAttendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'mahasiswa_id',
        'seminar_schedule_id',
        'waktu_absen',
        'metode_absen', // qr, manual
    ];

    protected $casts = [
        'waktu_absen' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function mahasiswa()
    {
        return $this->belongsTo(User::class, 'mahasiswa_id');
    }

    public function schedule()
    {
        return $this->belongsTo(SeminarSchedule::class, 'seminar_schedule_id');
    }

    public function seminar()
    {
        return $this->hasOneThrough(Seminar::class, SeminarSchedule::class, 'id', 'id', 'seminar_schedule_id', 'seminar_id');
    }

    // Scopes
    public function scopeByMahasiswa($query, $mahasiswaId)
    {
        return $query->where('mahasiswa_id', $mahasiswaId);
    }

    public function scopeBySchedule($query, $scheduleId)
    {
        return $query->where('seminar_schedule_id', $scheduleId);
    }

    public function scopeToday($query)
    {
        return $query->whereDate('waktu_absen', today());
    }

    // Helpers
    public function isQRAttendance()
    {
        return $this->metode_absen === 'qr';
    }

    public function isManualAttendance()
    {
        return $this->metode_absen === 'manual';
    }
}