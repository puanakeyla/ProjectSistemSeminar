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
        $schedules = SeminarSchedule::with(['seminar.mahasiswa'])
            ->orderBy('waktu_mulai', 'desc')
            ->get();

        return response()->json($schedules);
    }

    /**
     * Get available seminars for scheduling (approved but not scheduled)
     */
    public function availableSeminars(): JsonResponse
    {
        $seminars = Seminar::with([
            'mahasiswa', 
            'approvals.dosen'
        ])
            ->whereNotNull('verified_at')
            ->whereDoesntHave('schedule')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($seminar) {
                return [
                    'id' => $seminar->id,
                    'judul' => $seminar->judul,
                    'tipe' => $seminar->tipe,
                    'mahasiswa' => [
                        'name' => $seminar->mahasiswa->name,
                        'npm' => $seminar->mahasiswa->npm,
                    ],
                    'approvals' => $seminar->approvals->map(function ($approval) {
                        return [
                            'peran' => $approval->peran,
                            'dosen' => [
                                'name' => $approval->dosen->name,
                            ],
                            'available_dates' => $approval->available_dates,
                            'status' => $approval->status,
                        ];
                    }),
                    'created_at' => $seminar->created_at->format('d M Y'),
                ];
            });

        return response()->json($seminars);
    }

    /**
     * Create new seminar schedule
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'seminar_id' => 'required|exists:seminars,id',
            'ruang' => 'required|string|max:100',
            'waktu_mulai' => 'required|date|after:now',
            'durasi_menit' => 'required|integer|min:30|max:300',
            'status' => 'sometimes|string|in:scheduled,completed,cancelled',
        ]);

        // Check if seminar is verified
        $seminar = Seminar::whereNotNull('verified_at')
            ->findOrFail($validated['seminar_id']);

        // Check if seminar already has schedule
        if ($seminar->schedule) {
            return response()->json([
                'message' => 'Seminar ini sudah memiliki jadwal'
            ], 422);
        }

        // Create schedule
        $schedule = SeminarSchedule::create([
            'seminar_id' => $validated['seminar_id'],
            'ruang' => $validated['ruang'],
            'waktu_mulai' => $validated['waktu_mulai'],
            'durasi_menit' => $validated['durasi_menit'],
            'status' => $validated['status'] ?? 'scheduled',
        ]);

        return response()->json([
            'message' => 'Jadwal seminar berhasil dibuat',
            'data' => $schedule->load(['seminar.mahasiswa'])
        ], 201);
    }

    /**
     * Update seminar schedule
     */
    public function update(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'ruang' => 'sometimes|required|string|max:100',
            'waktu_mulai' => 'sometimes|required|date',
            'durasi_menit' => 'sometimes|required|integer|min:30|max:300',
            'status' => ['sometimes', 'required', Rule::in(['scheduled', 'completed', 'cancelled'])],
        ]);

        $schedule = SeminarSchedule::with(['seminar'])->findOrFail($id);
        $schedule->update($validated);

        return response()->json([
            'message' => 'Jadwal seminar berhasil diperbarui',
            'data' => $schedule->fresh(['seminar.mahasiswa'])
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