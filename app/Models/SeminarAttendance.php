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
        'waktu_scan',
        'waktu_absen',
        'metode', // qr, manual
        'metode_absen', // qr, manual
        'status', // present, late, invalid
        'qr_token',
    ];

    protected $casts = [
        'waktu_scan' => 'datetime',
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
        return $this->hasOneThrough(
            Seminar::class,
            SeminarSchedule::class,
            'id', // SeminarSchedule primary key
            'id', // Seminar primary key
            'seminar_schedule_id', // Foreign key on attendance
            'seminar_id' // Foreign key on schedule
        );
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
        return $query->whereDate('waktu_scan', today());
    }

    // Helpers
    public function isQRAttendance()
    {
        return $this->metode === 'qr';
    }

    public function isManualAttendance()
    {
        return $this->metode === 'manual';
    }

    // Relationship untuk revisi
    public function revisions()
    {
        return $this->hasMany(AttendanceRevision::class, 'seminar_attendance_id');
    }

    public function latestRevision()
    {
        return $this->hasOne(AttendanceRevision::class, 'seminar_attendance_id')->latestOfMany();
    }
}
