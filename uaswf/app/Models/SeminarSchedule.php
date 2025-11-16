<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SeminarSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'seminar_id',
        'ruangan',
        'tanggal_jam',
        'qr_code',
        'status',
    ];

    protected $casts = [
        'tanggal_jam' => 'datetime',
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
        return $query->where('tanggal_jam', '>=', now());
    }

    public function scopePast($query)
    {
        return $query->where('tanggal_jam', '<', now());
    }

    public function scopeToday($query)
    {
        return $query->whereDate('tanggal_jam', today());
    }

    // Helpers
    public function isUpcoming()
    {
        return $this->tanggal_jam >= now();
    }

    public function isPast()
    {
        return $this->tanggal_jam < now();
    }

    public function getFormattedDateTime()
    {
        return $this->tanggal_jam->format('d F Y H:i');
    }

    public function getFormattedDate()
    {
        return $this->tanggal_jam->format('d F Y');
    }

    public function getFormattedTime()
    {
        return $this->tanggal_jam->format('H:i');
    }
}