<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApprovalHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'seminar_id',
        'dosen_id',
        'action',
        'role',
        'catatan',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function seminar()
    {
        return $this->belongsTo(Seminar::class);
    }

    public function dosen()
    {
        return $this->belongsTo(User::class, 'dosen_id');
    }

    // Helpers
    public function getActionDisplay(): string
    {
        return match ($this->action) {
            'approved' => 'Disetujui',
            'rejected' => 'Ditolak',
            default => ucfirst($this->action),
        };
    }

    public function getRoleDisplay(): string
    {
        return match ($this->role) {
            'pembimbing1' => 'Pembimbing 1',
            'pembimbing2' => 'Pembimbing 2',
            'penguji' => 'Penguji',
            default => ucfirst($this->role),
        };
    }
}
