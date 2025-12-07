<?php

namespace App\Events;

use App\Models\DosenAttendance;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LecturerCheckedIn implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $attendance;

    /**
     * Create a new event instance.
     */
    public function __construct(DosenAttendance $attendance)
    {
        $this->attendance = $attendance;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin.lecturer-checkin'),
        ];
    }

    /**
     * Data yang dikirim ke client
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->attendance->id,
            'dosen_id' => $this->attendance->dosen_id,
            'dosen_name' => $this->attendance->dosen->name ?? 'Unknown',
            'dosen_nidn' => $this->attendance->dosen->nidn ?? '-',
            'seminar_schedule_id' => $this->attendance->seminar_schedule_id,
            'role' => $this->attendance->role,
            'role_display' => $this->attendance->getRoleDisplay(),
            'status' => $this->attendance->status,
            'is_verified_by_admin' => $this->attendance->is_verified_by_admin,
            'confirmed_at' => $this->attendance->confirmed_at?->toISOString(),
            'created_at' => $this->attendance->created_at->toISOString(),
        ];
    }

    /**
     * Nama event yang dikirim ke client
     */
    public function broadcastAs(): string
    {
        return 'lecturer.checked-in';
    }
}
