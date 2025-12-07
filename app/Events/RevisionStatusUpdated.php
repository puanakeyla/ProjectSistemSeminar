<?php

namespace App\Events;

use App\Models\AttendanceRevision;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RevisionStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $revision;

    /**
     * Create a new event instance.
     */
    public function __construct(AttendanceRevision $revision)
    {
        $this->revision = $revision;
    }

    /**
     * Get the channels the event should broadcast on.
     * Kirim ke channel pribadi mahasiswa yang request revisi
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->revision->requested_by),
        ];
    }

    /**
     * Data yang dikirim ke client
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->revision->id,
            'revision_status' => $this->revision->revision_status,
            'old_status' => $this->revision->old_status,
            'new_status' => $this->revision->new_status,
            'notes' => $this->revision->notes,
            'approved_by' => $this->revision->approver?->name,
            'responded_at' => $this->revision->responded_at?->toISOString(),
        ];
    }

    /**
     * Nama event yang dikirim ke client
     */
    public function broadcastAs(): string
    {
        return 'revision.status-updated';
    }
}
