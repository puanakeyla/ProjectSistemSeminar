<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AttendanceRevision extends Model
{
    use HasFactory;

    protected $fillable = [
        'seminar_attendance_id',
        'requested_by',
        'approved_by',
        'old_status',
        'new_status',
        'revision_status',
        'reason',
        'notes',
        'evidence_file',
        'requested_at',
        'responded_at',
    ];

    protected $casts = [
        'requested_at' => 'datetime',
        'responded_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function attendance()
    {
        return $this->belongsTo(SeminarAttendance::class, 'seminar_attendance_id');
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('revision_status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('revision_status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('revision_status', 'rejected');
    }

    // Helpers
    public function isPending(): bool
    {
        return $this->revision_status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->revision_status === 'approved';
    }

    public function isRejected(): bool
    {
        return $this->revision_status === 'rejected';
    }
}
