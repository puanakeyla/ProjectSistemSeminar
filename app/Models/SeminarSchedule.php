<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SeminarSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'seminar_id',
        'waktu_mulai',
        'durasi_menit',
        'ruang',
        'qr_code_path',
        'status',
    ];

    protected $casts = [
        'waktu_mulai' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function seminar()
    {
        return $this->belongsTo(Seminar::class);
    }

    public function attendances()
    {
        return $this->hasMany(SeminarAttendance::class);
    }

    // Scopes
    public function scopeUpcoming($query)
    {
        return $query->where('waktu_mulai', '>=', now());
    }

    public function scopePast($query)
    {
        return $query->where('waktu_mulai', '<', now());
    }

    public function scopeToday($query)
    {
        return $query->whereDate('waktu_mulai', today());
    }

    // Helpers
    public function isUpcoming()
    {
        return $this->waktu_mulai >= now();
    }

    public function isPast()
    {
        return $this->waktu_mulai < now();
    }

    public function isToday()
    {
        return $this->waktu_mulai->isToday();
    }

    public function getFormattedDateTime()
    {
        return $this->waktu_mulai->format('d F Y H:i');
    }

    public function getFormattedDate()
    {
        return $this->waktu_mulai->format('d F Y');
    }

    public function getFormattedTime()
    {
        return $this->waktu_mulai->format('H:i');
    }
}