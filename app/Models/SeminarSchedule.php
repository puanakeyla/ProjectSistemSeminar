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
        'lokasi',
        'latitude',
        'longitude',
        'radius_meter',
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

    /**
     * Get end time of seminar
     */
    public function getEndTime()
    {
        return $this->waktu_mulai->copy()->addMinutes($this->durasi_menit);
    }

    /**
     * Check if seminar is currently ongoing (with grace period)
     * Grace period: 15 minutes before start, 30 minutes after end
     */
    public function isOngoing(int $gracePeriodBefore = 15, int $gracePeriodAfter = 30): bool
    {
        $now = now();
        $startWithGrace = $this->waktu_mulai->copy()->subMinutes($gracePeriodBefore);
        $endWithGrace = $this->getEndTime()->addMinutes($gracePeriodAfter);

        return $now->between($startWithGrace, $endWithGrace);
    }

    /**
     * Check if seminar has started
     */
    public function hasStarted(): bool
    {
        return now() >= $this->waktu_mulai;
    }

    /**
     * Check if seminar has ended
     */
    public function hasEnded(): bool
    {
        return now() > $this->getEndTime();
    }

    /**
     * Get seminar status (upcoming, ongoing, finished)
     */
    public function getSeminarStatus(): string
    {
        if ($this->isOngoing()) {
            return 'ongoing';
        } elseif ($this->hasEnded()) {
            return 'finished';
        } else {
            return 'upcoming';
        }
    }

    /**
     * Get seminar status display
     */
    public function getSeminarStatusDisplay(): string
    {
        return match($this->getSeminarStatus()) {
            'ongoing' => 'Sedang Berlangsung',
            'finished' => 'Selesai',
            'upcoming' => 'Akan Datang',
            default => '-'
        };
    }

    /**
     * Get minutes until seminar starts (negative if already started)
     */
    public function getMinutesUntilStart(): int
    {
        return now()->diffInMinutes($this->waktu_mulai, false);
    }

    /**
     * Get minutes until seminar ends (negative if already ended)
     */
    public function getMinutesUntilEnd(): int
    {
        return now()->diffInMinutes($this->getEndTime(), false);
    }

    /**
     * Scope: Currently ongoing seminars
     */
    public function scopeOngoing($query, int $gracePeriodBefore = 15, int $gracePeriodAfter = 30)
    {
        $now = now();
        return $query->where('waktu_mulai', '<=', $now->copy()->addMinutes($gracePeriodBefore))
            ->where(function($q) use ($now, $gracePeriodAfter) {
                $q->whereRaw('DATE_ADD(waktu_mulai, INTERVAL (durasi_menit + ?) MINUTE) >= ?',
                    [$gracePeriodAfter, $now]);
            });
    }
}
