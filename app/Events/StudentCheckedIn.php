<?php

namespace App\Events;

use App\Models\SeminarAttendance;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StudentCheckedIn implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $attendance;

    /**
     * Create a new event instance.
     */
    public function __construct(SeminarAttendance $attendance)
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
            new PrivateChannel('admin.student-attendance'),
        ];
    }

    /**
     * Data yang dikirim ke client
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->attendance->id,
            'mahasiswa_id' => $this->attendance->mahasiswa_id,
            'mahasiswa_name' => $this->attendance->mahasiswa->name ?? 'Unknown',
            'mahasiswa_npm' => $this->attendance->mahasiswa->npm ?? '-',
            'seminar_schedule_id' => $this->attendance->seminar_schedule_id,
            'waktu_scan' => $this->attendance->waktu_scan?->toISOString(),
            'status' => $this->attendance->status,
            'metode' => $this->attendance->metode,
            'distance_meter' => $this->attendance->distance_meter,
            'created_at' => $this->attendance->created_at->toISOString(),
        ];
    }

    /**
     * Nama event yang dikirim ke client
     */
    public function broadcastAs(): string
    {
        return 'student.checked-in';
    }
}
