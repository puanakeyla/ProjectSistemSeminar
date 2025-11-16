<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Seminar;
use App\Models\SeminarSchedule;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ScheduleController extends Controller
{
    /**
     * Get all seminar schedules
     */
    public function index(Request $request): JsonResponse
    {
        $filter = $request->get('filter', 'all'); // all, upcoming, past, today

        $query = SeminarSchedule::with(['seminar.mahasiswa', 'seminar.pembimbing1', 'seminar.pembimbing2', 'seminar.penguji']);

        switch ($filter) {
            case 'upcoming':
                $query->upcoming();
                break;
            case 'past':
                $query->past();
                break;
            case 'today':
                $query->today();
                break;
        }

        $schedules = $query->orderBy('tanggal_jam', 'desc')
            ->get()
            ->map(function ($schedule) {
                return $this->formatScheduleData($schedule);
            });

        return response()->json([
            'message' => 'Seminar schedules retrieved successfully',
            'data' => $schedules
        ]);
    }

    /**
     * Get available seminars for scheduling (approved but not scheduled)
     */
    public function availableSeminars(): JsonResponse
    {
        $seminars = Seminar::with(['mahasiswa', 'pembimbing1', 'pembimbing2', 'penguji'])
            ->where('status', 'disetujui')
            ->whereDoesntHave('schedule')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($seminar) {
                return [
                    'id' => $seminar->id,
                    'judul' => $seminar->judul,
                    'jenis_seminar' => $seminar->getJenisSeminarDisplay(),
                    'mahasiswa_name' => $seminar->mahasiswa->name,
                    'mahasiswa_npm' => $seminar->mahasiswa->npm,
                    'pembimbing1' => $seminar->pembimbing1->name,
                    'pembimbing2' => $seminar->pembimbing2->name,
                    'penguji' => $seminar->penguji->name,
                    'created_at' => $seminar->created_at->format('d M Y'),
                ];
            });

        return response()->json([
            'message' => 'Available seminars for scheduling retrieved successfully',
            'data' => $seminars
        ]);
    }

    /**
     * Create new seminar schedule
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'seminar_id' => 'required|exists:seminars,id',
            'ruangan' => 'required|string|max:50',
            'tanggal_jam' => 'required|date|after:now',
        ]);

        // Check if seminar is approved
        $seminar = Seminar::where('id', $validated['seminar_id'])
            ->where('status', 'disetujui')
            ->firstOrFail();

        // Check if seminar already has schedule
        if ($seminar->schedule) {
            return response()->json([
                'message' => 'Seminar ini sudah memiliki jadwal'
            ], 422);
        }

        // Check for room conflict
        $conflictingSchedule = SeminarSchedule::where('ruangan', $validated['ruangan'])
            ->where('tanggal_jam', '>=', $validated['tanggal_jam'])
            ->where('tanggal_jam', '<=', date('Y-m-d H:i:s', strtotime($validated['tanggal_jam'] . ' +2 hours')))
            ->first();

        if ($conflictingSchedule) {
            return response()->json([
                'message' => 'Ruangan sudah dipakai pada waktu tersebut'
            ], 422);
        }

        // Create schedule
        $schedule = SeminarSchedule::create([
            'seminar_id' => $validated['seminar_id'],
            'ruangan' => $validated['ruangan'],
            'tanggal_jam' => $validated['tanggal_jam'],
            'status' => 'terjadwal',
        ]);

        return response()->json([
            'message' => 'Jadwal seminar berhasil dibuat',
            'data' => $this->formatScheduleData($schedule->load(['seminar.mahasiswa', 'seminar.pembimbing1', 'seminar.pembimbing2', 'seminar.penguji']))
        ], 201);
    }

    /**
     * Update seminar schedule
     */
    public function update(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'ruangan' => 'sometimes|required|string|max:50',
            'tanggal_jam' => 'sometimes|required|date',
            'status' => ['sometimes', 'required', Rule::in(['terjadwal', 'selesai', 'dibatalkan'])],
        ]);

        $schedule = SeminarSchedule::with(['seminar'])->findOrFail($id);

        // Check for room conflict if updating room or time
        if (isset($validated['ruangan']) || isset($validated['tanggal_jam'])) {
            $room = $validated['ruangan'] ?? $schedule->ruangan;
            $datetime = $validated['tanggal_jam'] ?? $schedule->tanggal_jam;

            $conflictingSchedule = SeminarSchedule::where('ruangan', $room)
                ->where('tanggal_jam', '>=', $datetime)
                ->where('tanggal_jam', '<=', date('Y-m-d H:i:s', strtotime($datetime . ' +2 hours')))
                ->where('id', '!=', $id)
                ->first();

            if ($conflictingSchedule) {
                return response()->json([
                    'message' => 'Ruangan sudah dipakai pada waktu tersebut'
                ], 422);
            }
        }

        $schedule->update($validated);

        return response()->json([
            'message' => 'Jadwal seminar berhasil diperbarui',
            'data' => $this->formatScheduleData($schedule->fresh(['seminar.mahasiswa', 'seminar.pembimbing1', 'seminar.pembimbing2', 'seminar.penguji']))
        ]);
    }

    /**
     * Delete seminar schedule
     */
    public function destroy($id): JsonResponse
    {
        $schedule = SeminarSchedule::findOrFail($id);
        
        // Also delete related attendances
        $schedule->attendances()->delete();
        
        $schedule->delete();

        return response()->json([
            'message' => 'Jadwal seminar berhasil dihapus'
        ]);
    }

    /**
     * Get schedule statistics
     */
    public function statistics(): JsonResponse
    {
        $stats = [
            'total_scheduled' => SeminarSchedule::count(),
            'upcoming' => SeminarSchedule::upcoming()->count(),
            'today' => SeminarSchedule::today()->count(),
            'past' => SeminarSchedule::past()->count(),
            'completed' => SeminarSchedule::where('status', 'selesai')->count(),
            'cancelled' => SeminarSchedule::where('status', 'dibatalkan')->count(),
        ];

        // Room usage statistics
        $roomStats = SeminarSchedule::selectRaw('ruangan, COUNT(*) as count')
            ->groupBy('ruangan')
            ->orderBy('count', 'desc')
            ->get();

        return response()->json([
            'message' => 'Schedule statistics retrieved successfully',
            'data' => [
                'schedule_stats' => $stats,
                'room_stats' => $roomStats,
            ]
        ]);
    }

    /**
     * Format schedule data for response
     */
    private function formatScheduleData(SeminarSchedule $schedule): array
    {
        $seminar = $schedule->seminar;

        return [
            'id' => $schedule->id,
            'seminar_id' => $schedule->seminar_id,
            'judul' => $seminar->judul,
            'jenis_seminar' => $seminar->getJenisSeminarDisplay(),
            'mahasiswa_name' => $seminar->mahasiswa->name,
            'mahasiswa_npm' => $seminar->mahasiswa->npm,
            'ruangan' => $schedule->ruangan,
            'tanggal_jam' => $schedule->tanggal_jam->format('Y-m-d H:i:s'),
            'tanggal_display' => $schedule->getFormattedDate(),
            'waktu_display' => $schedule->getFormattedTime(),
            'status' => $schedule->status,
            'is_upcoming' => $schedule->isUpcoming(),
            'is_past' => $schedule->isPast(),
            'is_today' => $schedule->isToday(),
            'pembimbing1' => $seminar->pembimbing1->name,
            'pembimbing2' => $seminar->pembimbing2->name,
            'penguji' => $seminar->penguji->name,
            'qr_code' => $schedule->qr_code,
            'attendees_count' => $schedule->attendances()->count(),
            'created_at' => $schedule->created_at->format('d M Y H:i'),
        ];
    }
}