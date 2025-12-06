<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class SeminarRevisionItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'revision_id',
        'created_by',
        'poin_revisi',
        'kategori',
        'status',
        'mahasiswa_notes',
        'file_path',
        'submitted_at',
        'validated_at',
        'validated_by',
        'rejection_reason',
        'revision_count',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'validated_at' => 'datetime',
        'revision_count' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function revision()
    {
        return $this->belongsTo(SeminarRevision::class, 'revision_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function validator()
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeSubmitted($query)
    {
        return $query->where('status', 'submitted');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    // Helpers
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isSubmitted(): bool
    {
        return $this->status === 'submitted';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    public function getFileUrl(): ?string
    {
        return $this->file_path ? Storage::url($this->file_path) : null;
    }

    public function getStatusDisplay(): string
    {
        return match ($this->status) {
            'pending' => 'Belum Dikerjakan',
            'submitted' => 'Menunggu Validasi',
            'approved' => 'Disetujui',
            'rejected' => 'Perlu Diperbaiki',
            default => ucfirst($this->status ?? '-')
        };
    }

    public function getStatusColor(): string
    {
        return match($this->status) {
            'pending' => 'gray',
            'submitted' => 'yellow',
            'approved' => 'green',
            'rejected' => 'red',
            default => 'gray'
        };
    }

    // Mark as submitted by mahasiswa
    public function markAsSubmitted(string $notes = null, string $filePath = null): bool
    {
        $this->status = 'submitted';
        $this->mahasiswa_notes = $notes;
        $this->file_path = $filePath;
        $this->submitted_at = now();
        
        return $this->save();
    }

    // Approve by dosen
    public function approve(int $dosenId): bool
    {
        $this->status = 'approved';
        $this->validated_at = now();
        $this->validated_by = $dosenId;
        $this->rejection_reason = null;
        
        return $this->save();
    }

    // Reject by dosen
    public function reject(int $dosenId, string $reason): bool
    {
        $this->status = 'rejected';
        $this->validated_at = now();
        $this->validated_by = $dosenId;
        $this->rejection_reason = $reason;
        $this->revision_count++;
        
        return $this->save();
    }
}
