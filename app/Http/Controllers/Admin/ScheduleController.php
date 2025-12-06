<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Seminar;
use App\Models\SeminarSchedule;
use App\Services\NotificationService;
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
     * Get available seminars for scheduling (verified but not scheduled)
     */
    public function availableSeminars(): JsonResponse
    {
        $seminars = Seminar::with([
            'mahasiswa', 
            'approvals.dosen'
        ])
            ->where('status', 'approved') // Only approved seminars (verified by admin)
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

        // Check if seminar is approved (verified by admin)
        $seminar = Seminar::where('status', 'approved')
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

        // Update seminar status to scheduled
        $seminar->update([
            'status' => 'scheduled'
        ]);

        // Send notification to all parties
        NotificationService::notifySeminarScheduled(
            $seminar->fresh(['mahasiswa', 'pembimbing1', 'pembimbing2', 'penguji', 'schedule'])
        );

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
            'cancel_reason' => 'sometimes|nullable|string|max:500',
        ]);

        $schedule = SeminarSchedule::with(['seminar.mahasiswa', 'seminar.pembimbing1', 'seminar.pembimbing2', 'seminar.penguji'])->findOrFail($id);
        
        // Store old values for reschedule notification
        $oldWaktuMulai = $schedule->waktu_mulai;
        $oldRuang = $schedule->ruang;
        
        // Detect if this is a cancellation
        if (isset($validated['status']) && $validated['status'] === 'cancelled') {
            // Cancel the seminar via admin
            NotificationService::notifySeminarCancelledByAdmin(
                $schedule->seminar,
                $request->user(),
                $validated['cancel_reason'] ?? 'Tidak ada alasan diberikan'
            );
            
            // Update seminar status
            $schedule->seminar->update(['status' => 'cancelled']);
        }
        
        // Detect if this is a reschedule (time or room change)
        if (isset($validated['waktu_mulai']) || isset($validated['ruang'])) {
            $changes = [];
            if (isset($validated['waktu_mulai']) && $validated['waktu_mulai'] != $oldWaktuMulai) {
                $changes['waktu'] = [
                    'old' => $oldWaktuMulai,
                    'new' => $validated['waktu_mulai']
                ];
            }
            if (isset($validated['ruang']) && $validated['ruang'] != $oldRuang) {
                $changes['ruang'] = [
                    'old' => $oldRuang,
                    'new' => $validated['ruang']
                ];
            }
            
            if (!empty($changes)) {
                NotificationService::notifySeminarRescheduled(
                    $schedule->seminar,
                    $request->user(),
                    $changes
                );
            }
        }
        
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
            'ruangan' => $schedule->ruang,
            'tanggal_jam' => $schedule->waktu_mulai->format('Y-m-d H:i:s'),
            'tanggal_display' => $schedule->getFormattedDate(),
            'waktu_display' => $schedule->getFormattedTime(),
            'status' => $schedule->status,
            'is_upcoming' => $schedule->isUpcoming(),
            'is_past' => $schedule->isPast(),
            'is_today' => $schedule->isToday(),
            'pembimbing1' => $seminar->pembimbing1 ? $seminar->pembimbing1->name : null,
            'pembimbing2' => $seminar->pembimbing2 ? $seminar->pembimbing2->name : null,
            'penguji' => $seminar->penguji ? $seminar->penguji->name : null,
            'qr_code' => $schedule->qr_code,
            'attendees_count' => $schedule->attendances()->count(),
            'created_at' => $schedule->created_at->format('d M Y H:i'),
        ];
    }
}
