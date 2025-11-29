<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'npm',
        'nidn',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    // Relationships
    public function seminarsAsMahasiswa()
    {
        return $this->hasMany(Seminar::class, 'mahasiswa_id');
    }

    public function seminarsAsPembimbing1()
    {
        return $this->hasMany(Seminar::class, 'pembimbing1_id');
    }

    public function seminarsAsPembimbing2()
    {
        return $this->hasMany(Seminar::class, 'pembimbing2_id');
    }

    public function seminarsAsPenguji()
    {
        return $this->hasMany(Seminar::class, 'penguji_id');
    }

    public function seminarApprovals()
    {
        return $this->hasMany(SeminarApproval::class, 'dosen_id');
    }

    public function attendances()
    {
        return $this->hasMany(SeminarAttendance::class, 'mahasiswa_id');
    }

    // Scopes
    public function scopeDosen($query)
    {
        return $query->where('role', 'dosen');
    }

    public function scopeMahasiswa($query)
    {
        return $query->where('role', 'mahasiswa');
    }

    public function scopeAdmin($query)
    {
        return $query->where('role', 'admin');
    }

    // Helpers
    public function isMahasiswa()
    {
        return $this->role === 'mahasiswa';
    }

    public function isDosen()
    {
        return $this->role === 'dosen';
    }

    public function isAdmin()
    {
        return $this->role === 'admin';
    }
}